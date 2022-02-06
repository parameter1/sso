import inquirer from 'inquirer';
import { workspaceAttributes as workspaceAttrs } from '@parameter1/sso-db/schema';
import { getWorkspaceList } from '../utils/index.js';
import repos from '../../repos.js';

const { log } = console;

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
      validate: async (input) => {
        const { error } = workspaceAttrs.name.required().validate(input);
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
    name,
  } = await inquirer.prompt(questions);

  if (!confirm) return;

  const result = await repos.$('workspace').updateAttributes({
    id: workspace._id,
    name,
  });
  log(result);
};
