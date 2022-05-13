import inquirer from 'inquirer';
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
  } = await inquirer.prompt(questions);

  if (!user) {
    log('> No eligible users were found for this workspace');
    return null;
  }

  const { workspace } = eligible;
  return confirm ? repos.$('user').leaveWorkspace({
    workspaceId: workspace._id,
    userId: user._id,
  }) : null;
};
