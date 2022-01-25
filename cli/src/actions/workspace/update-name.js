import inquirer from 'inquirer';
import { workspaceAttributes as workspaceAttrs } from '@parameter1/sso-db/schema';
import { getWorkspaceList } from '../utils/index.js';
import repos from '../../repos.js';
import create from './create.js';

const { log } = console;

export default async () => {
  const workspaceList = await getWorkspaceList();
  const hasWorkspaces = Boolean(workspaceList.length);

  const questions = [
    {
      type: 'list',
      name: 'workspace',
      when: hasWorkspaces,
      message: 'Select the workspace',
      choices: workspaceList,
    },
    {
      type: 'confirm',
      name: 'createWorkspace',
      when: !hasWorkspaces,
      message: 'No workspaces exit. Would you like to create one?',
      default: false,
    },
    {
      type: 'input',
      name: 'name',
      default: ({ workspace }) => workspace.name,
      message: 'Enter the new workspace name',
      when: ({ workspace }) => Boolean(workspace),
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
      when: ({ workspace }) => Boolean(workspace),
    },
  ];

  const {
    createWorkspace,
    confirm,
    workspace,
    name,
  } = await inquirer.prompt(questions);

  if (createWorkspace) return create();
  if (!confirm || !workspace) return null;

  const result = await repos.$('workspace').updateName({
    id: workspace._id,
    name,
  });
  return log(result);
};
