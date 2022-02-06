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

        if (input === workspace.slug) return true;

        const doc = await repos.$('workspace').findOne({
          query: { slug: input, 'app._id': workspace.app._id, 'org._id': workspace.org._id },
          options: { projection: { _id: 1 } },
        });
        if (doc) return new Error('An existing record is already using this slug.');

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
      filter: (input) => {
        const { value } = workspaceAttrs.slug.validate(input);
        return value;
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
