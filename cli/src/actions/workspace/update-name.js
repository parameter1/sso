import inquirer from 'inquirer';
import { workspaceProps } from '@parameter1/sso-mongodb';
import { getWorkspaceList } from '../utils/index.js';
import repos from '../../repos.js';

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
    workspace,
    name,
  } = await inquirer.prompt(questions);

  return confirm ? repos.$('workspace').updateName({
    id: workspace._id,
    name,
  }) : null;
};
