import inquirer from 'inquirer';
import { asArray } from '@parameter1/utils';
import { workspaceAttributes as workspaceAttrs } from '@parameter1/sso-db/schema';
import { getUserList, getWorkspaceList } from '../utils/index.js';
import repos from '../../repos.js';

const { log } = console;

export default async () => {
  const questions = [
    {
      type: 'list',
      name: 'eligible',
      message: 'Select the workspace',
      choices: () => getWorkspaceList({ projection: { members: 1 } }),
      filter: async (workspace) => {
        const memberEmails = asArray(workspace.members).reduce((set, member) => {
          set.add(member.user.email);
          return set;
        }, new Set());

        const users = await getUserList({
          query: { email: { $nin: [...memberEmails] } },
        });
        return { workspace, users };
      },
    },
    {
      type: 'list',
      name: 'user',
      message: 'Select the user',
      when: ({ eligible }) => Boolean(eligible.users.length),
      choices: async ({ eligible }) => eligible.users,
    },
    {
      type: 'list',
      name: 'role',
      message: 'Select the member role',
      when: ({ eligible }) => Boolean(eligible.users.length),
      choices: async ({ eligible }) => {
        const app = await repos.$('application').findBySlug({ slug: eligible.workspace.app.slug });
        return app.roles;
      },
      validate: (input) => {
        const { error } = workspaceAttrs.role().required().validate(input);
        if (error) return error;
        return true;
      },
    },
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Are you sure you want to complete this action?',
      default: false,
      when: ({ eligible }) => Boolean(eligible.users.length),
    },
  ];

  const {
    confirm,
    eligible,
    user,
    role,
  } = await inquirer.prompt(questions);

  if (!user) {
    log('> No eligible users were found for this workspace');
    return;
  }

  if (!confirm) return;

  const { workspace } = eligible;

  const result = await repos.$('workspace').addMember({
    workspace: {
      _id: workspace._id,
      slug: workspace.slug,
      name: workspace.name,
      app: workspace.app,
      org: workspace.org,
    },
    user: {
      _id: user._id,
      email: user.email,
      givenName: user.givenName,
      familyName: user.familyName,
    },
    role,
  });
  log(result);
};
