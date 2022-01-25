import inquirer from 'inquirer';
import { organizationAttributes as orgAttrs } from '@parameter1/sso-db/schema';
import { getOrgList } from '../utils/index.js';
import repos from '../../repos.js';

const { log } = console;

export default async () => {
  const questions = [
    {
      type: 'list',
      name: 'org',
      message: 'Select the organization',
      choices: getOrgList,
    },
    {
      type: 'input',
      name: 'slug',
      default: ({ org }) => org.slug,
      message: 'Enter the new organization slug',
      validate: async (input, { org }) => {
        const { error } = orgAttrs.slug.required().validate(input);
        if (error) return error;
        try {
          await repos.$('organization').throwIfSlugHasRedirect({ id: org._id, slug: input });
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
    org,
    slug,
  } = await inquirer.prompt(questions);

  if (!confirm) return;

  const result = await repos.$('organization').updateSlug({
    id: org._id,
    slug,
  });
  log(result);
};
