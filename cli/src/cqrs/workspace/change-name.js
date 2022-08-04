import inquirer from 'inquirer';
import { workspaceCommandProps } from '@parameter1/sso-mongodb';
import { getWorkspaceList, waitUntilProcessed } from '../utils/index.js';
import { entityManager } from '../../mongodb.js';

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
      default: ({ workspace }) => workspace.name.default,
      message: 'Enter the new workspace name',
      filter: (input) => {
        const { value } = workspaceCommandProps.name.required().validate(input);
        return value;
      },
      validate: async (input) => {
        const { error } = workspaceCommandProps.name.required().validate(input);
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

  const handler = entityManager.getCommandHandler('workspace');
  return waitUntilProcessed(() => handler.changeName({
    entityId: workspace._id,
    name,
  }));
};
