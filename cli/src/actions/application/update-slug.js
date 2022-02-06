import inquirer from 'inquirer';
import { applicationAttributes as appAttrs } from '@parameter1/sso-db/schema';
import { getAppList } from '../utils/index.js';
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
      type: 'input',
      name: 'slug',
      default: ({ app }) => app.slug,
      message: 'Enter the new application slug',
      validate: async (input, { app }) => {
        const { error } = appAttrs.slug.required().validate(input);
        if (error) return error;

        if (input === app.slug) return true;

        const doc = await repos.$('application').findBySlug({ slug: input, options: { projection: { _id: 1 } } });
        if (doc) return new Error('An existing record is already using this slug.');
        try {
          await repos.$('application').throwIfSlugHasRedirect({ id: app._id, slug: input });
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
    slug,
  } = await inquirer.prompt(questions);

  if (!confirm) return;

  const result = await repos.$('application').updateSlug({
    id: app._id,
    slug,
  });
  log(result);
};
