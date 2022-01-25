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
      name: 'slug',
      default: ({ workspace }) => workspace.slug,
      message: 'Enter the new workspace slug',
      validate: async (input, { workspace }) => {
        const { error } = workspaceAttrs.slug.required().validate(input);
        if (error) return error;
        try {
          await repos.$('workspace').throwIfSlugHasRedirect({
            id: workspace._id,
            slug: input,
            appId: workspace.app._id,
            orgId: workspace.org._id,
          });
          return true;
        } catch (e) {
          return e;
        }
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
    slug,
  } = await inquirer.prompt(questions);

  if (!confirm) return;

  const result = await repos.$('workspace').updateSlug({
    id: workspace._id,
    slug,
    appId: workspace.app._id,
    orgId: workspace.org._id,
  });
  log(result);
};
