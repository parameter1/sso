import inquirer from 'inquirer';
import { applicationAttributes as appAttrs } from '@tenancy/db/schema';
import { sluggify } from '@parameter1/slug';
import repos from '../repos.js';

const { log } = console;

export default async function createApplication() {
  const questions = [
    {
      type: 'input',
      name: 'name',
      message: 'Enter the application name',
      validate: (input) => {
        const { error } = appAttrs.name.required().validate(input);
        if (error) return error;
        return true;
      },
    },
    {
      type: 'input',
      name: 'slug',
      message: 'Enter the application slug key',
      default: ({ name }) => sluggify(name),
      validate: (input) => {
        const { error } = appAttrs.slug.required().validate(input);
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
  } = await inquirer.prompt(questions);

  if (!confirm) return;

  const result = await repos.$('application').create({ name, slug });
  log(result);
}
