import inquirer from 'inquirer';
import { asArray } from '@parameter1/utils';
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
          query: { email: { $in: [...memberEmails] } },
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
    return;
  }

  if (!confirm) return;

  const { workspace } = eligible;

  const result = await repos.$('workspace').removeMember({
    workspaceId: workspace._id,
    userId: user._id,
  });
  log(result);
};
