import inquirer from 'inquirer';
import { userAttributes as userAttrs } from '@parameter1/sso-db/schema';
import { getOrgList } from './utils/index.js';
import repos from '../repos.js';

const { log } = console;

export default async function createInstance() {
  const questions = [
    {
      type: 'list',
      name: 'org',
      message: 'Select the organization',
      choices: getOrgList,
    },
    {
      type: 'input',
      name: 'name',
      default: ({ org }) => org.name,
      message: 'Enter the new organization name',
      validate: async (input) => {
        const { error } = userAttrs.givenName.required().validate(input);
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
    org,
    name,
  } = await inquirer.prompt(questions);

  if (!confirm) return;

  const result = await repos.$('organization').updateName({
    id: org._id,
    name,
  });
  log(result);
}
