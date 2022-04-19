import inquirer from 'inquirer';
import { workspaceProps } from '@parameter1/sso-mongodb';
import { getUserList, getWorkspaceList } from '../utils/index.js';
import repos from '../../repos.js';

export default async () => {
  const questions = [
    {
      type: 'list',
      name: 'workspace',
      message: 'Select the workspace',
      choices: () => getWorkspaceList(),
    },
    {
      type: 'list',
      name: 'user',
      message: 'Select the user',
      choices: async ({ workspace }) => getUserList({
        query: { 'workspaces._id': { $ne: workspace._id } },
      }),
    },
    {
      type: 'list',
      name: 'role',
      message: 'Select the member role',
      choices: async ({ workspace }) => {
        const doc = await repos.$('application').findByObjectId({ id: workspace.application._id, options: { strict: true } });
        return doc.roles;
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
    },
  ];

  const {
    confirm,
    workspace,
    user,
    role,
  } = await inquirer.prompt(questions);

  return confirm ? repos.$('user').joinWorkspace({
    userId: user._id,
    workspaceId: workspace._id,
    role,
  }) : null;
};
