import inquirer from 'inquirer';
import { workspaceAttributes as workspaceAttrs } from '@parameter1/sso-db/schema';
import { sluggify } from '@parameter1/slug';
import { getAppList, getOrgList } from '../utils/index.js';
import repos from '../../repos.js';

const { log } = console;

export default async () => {
  const questions = [
    {
      type: 'list',
      name: 'app',
      message: 'Select the application',
      choices: getAppList,
    },
    {
      type: 'list',
      name: 'org',
      message: 'Select the organization',
      choices: getOrgList,
    },
    {
      type: 'input',
      name: 'name',
      message: 'Enter the workspace name',
      default: 'Default',
    },
    {
      type: 'input',
      name: 'slug',
      message: 'Enter the workspace slug key',
      default: ({ name }) => sluggify(name),
      validate: async (input, { app, org }) => {
        const repo = repos.$('workspace');
        const { error } = workspaceAttrs.slug.required().validate(input);
        if (error) return error;

        const doc = await repo.findOne({
          query: {
            'app._id': app._id,
            'org._id': org._id,
            slug: input,
          },
          options: { projection: { _id: 1 } },
        });
        if (doc) return new Error('A workspace already exists with this slug');

        try {
          await repo.throwIfSlugHasRedirect({ slug: input });
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
    app,
    org,
    name,
    slug,
  } = await inquirer.prompt(questions);

  if (!confirm) return;

  const result = await repos.$('workspace').create({
    app: { _id: app._id, slug: app.slug, name: app.name },
    org: { _id: org._id, slug: org.slug, name: org.name },
    slug,
    name,
  });
  log(result);
};
