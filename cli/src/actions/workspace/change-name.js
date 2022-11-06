import inquirer from 'inquirer';
import { workspaceProps } from '@parameter1/sso-mongodb-command';

import { getWorkspaceList } from '../utils/index.js';
import { workspaceCommands } from '../../mongodb.js';
import { waitUntilProcessed } from '../../pubsub.js';

export default async () => {
  const questions = [
    {
      type: 'list',
      name: 'workspace',
      message: 'Select the workspace',
      choices: getWorkspaceList,
    },
    {
      type: 'input',
      name: 'name',
      default: ({ workspace }) => workspace.name,
      message: 'Enter the new workspace name',
      filter: (input) => {
        const { value } = workspaceProps.name.required().validate(input);
        return value;
      },
      validate: async (input) => {
        const { error } = workspaceProps.name.required().validate(input);
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
    name,
    workspace,
  } = await inquirer.prompt(questions);
  if (!confirm) return null;

  return waitUntilProcessed(() => workspaceCommands.changeName({
    input: [{ entityId: workspace._id, name }],
  }));
};
