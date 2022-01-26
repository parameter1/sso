import inquirer from 'inquirer';
import { organizationAttributes as orgAttrs } from '@parameter1/sso-db/schema';
import { sluggify } from '@parameter1/slug';
import repos from '../../repos.js';

const { log } = console;

export default async () => {
  const questions = [
    {
      type: 'input',
      name: 'name',
      message: 'Enter the organization name',
      validate: (input) => {
        const { error } = orgAttrs.name.required().validate(input);
        if (error) return error;
        return true;
      },
    },
    {
      type: 'input',
      name: 'slug',
      message: 'Enter the organization slug key',
      default: ({ name }) => sluggify(name),
      validate: async (input) => {
        const repo = repos.$('organization');
        const { error } = orgAttrs.slug.required().validate(input);
        if (error) return error;

        const doc = await repo.findBySlug({
          slug: input,
          options: { projection: { _id: 1 } },
        });
        if (doc) return new Error('An organization already exists with this slug');

        try {
          await repo.throwIfSlugHasRedirect({ slug: input });
          return true;
        } catch (e) {
          return e;
        }
      },
    },
    {
      type: 'input',
      name: 'emailDomains',
      message: 'Enter comma separated list of organization email domains',
      filter: (list) => list.split(',').map((v) => v.trim()).filter((v) => v),
      validate: (domains) => {
        const { error } = orgAttrs.emailDomains.validate(domains);
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
    slug,
    emailDomains,
  } = await inquirer.prompt(questions);

  if (!confirm) return;

  const result = await repos.$('organization').create({
    name,
    slug,
    emailDomains,
  });
  log(result);
};
