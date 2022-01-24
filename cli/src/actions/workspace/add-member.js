import inquirer from 'inquirer';
import { asArray } from '@parameter1/utils';
import { workspaceAttributes as workspaceAttrs } from '@parameter1/sso-db/schema';
import getUserList from '../utils/get-user-list.js';
import repos from '../../repos.js';

const { log } = console;

export default async function createInstance() {
  const questions = [
    {
      type: 'list',
      name: 'workspace',
      message: 'Select the workspace',
      choices: async () => {
        const cursor = await repos.$('workspace').find({
          query: {},
          options: {
            projection: {
              app: 1,
              org: 1,
              members: 1,
              name: 1,
              slug: 1,
            },
            sort: { 'app.name': 1, 'org.name': 1, name: 1 },
          },
        });
        const docs = await cursor.toArray();
        return docs.map((ws) => {
          const { app, org } = ws;
          const name = [app.name, org.name, ws.name].join(' > ');
          const ns = [app.slug, org.slug, ws.slug].join('.');
          return { name: `${name} [${ns}]`, value: ws };
        });
      },
    },
    {
      type: 'list',
      name: 'user',
      message: 'Select the user to add as a member',
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

  const result = await repos.addWorkspaceMember({
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
}
