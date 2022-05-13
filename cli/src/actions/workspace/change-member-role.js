import inquirer from 'inquirer';
import { workspaceProps } from '@parameter1/sso-mongodb';
import { getUserList, getWorkspaceList } from '../utils/index.js';
import repos from '../../repos.js';

const { log } = console;

export default async () => {
  const questions = [
    {
      type: 'list',
      name: 'eligible',
      message: 'Select the workspace',
      choices: async () => {
        const workspaceIds = await repos.$('user').distinct({
          key: '_connection.workspace.edges._id',
        });
        return getWorkspaceList({ query: { _id: { $in: workspaceIds } } });
      },
      filter: async (workspace) => {
        const users = await getUserList({
          projection: { '_connection.workspace.edges': 1 },
          query: { '_connection.workspace.edges._id': workspace._id },
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
      choices: async ({ user, eligible }) => {
        const { workspace } = eligible;
        const app = await repos.$('application').findByObjectId({ id: workspace.application._id, options: { strict: true } });
        const { role } = user._connection.workspace.edges.find(({ _id }) => `${_id}` === `${workspace._id}`);
        return app.roles.map((r) => ({
          name: r === role ? `${r} (current role)` : r,
          value: r,
        }));
      },
      filter: (input) => {
        const { value } = workspaceProps.memberRole.required().validate(input);
        return value;
      },
      validate: (input) => {
        const { error } = workspaceProps.memberRole.required().validate(input);
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
    return null;
  }

  const { workspace } = eligible;

  return confirm ? repos.$('user').changeWorkspaceRole({
    workspaceId: workspace._id,
    userId: user._id,
    role,
  }) : null;
};
