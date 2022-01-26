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
      name: 'workspace',
      message: 'Select the workspace',
      choices: () => getWorkspaceList({ projection: { members: 1 } }),
    },
    {
      type: 'list',
      name: 'user',
      message: 'Select the user',
      choices: async ({ workspace }) => {
        const memberEmails = asArray(workspace.members).reduce((set, member) => {
          set.add(member.user.email);
          return set;
        }, new Set());

        return getUserList({
          disabledWhen: (user) => memberEmails.has(user.email),
        });
      },
    },
    {
      type: 'list',
      name: 'role',
      message: 'Select the member role',
      // @todo these need to come from the possible app roles
      choices: () => ['Administrator', 'Member'],
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
    },
  ];

  const {
    confirm,
    workspace,
    user,
    role,
  } = await inquirer.prompt(questions);

  if (!confirm) return;

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
