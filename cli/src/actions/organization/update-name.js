import inquirer from 'inquirer';
import { organizationAttributes as orgAttrs } from '@parameter1/sso-db/schema';
import { getOrgList } from '../utils/index.js';
import repos from '../../repos.js';
import create from './create.js';

const { log } = console;

export default async () => {
  const orgList = await getOrgList();
  const questions = [
    {
      type: 'list',
      name: 'org',
      when: Boolean(orgList.length),
      message: 'Select the organization',
      choices: orgList,
    },
    {
      type: 'confirm',
      name: 'createOrg',
      when: Boolean(!orgList.length),
      message: 'No organizations exit. Would you like to create one?',
      default: false,
    },
    {
      type: 'input',
      name: 'name',
      default: ({ org }) => org.name,
      message: 'Enter the new organization name',
      when: ({ org }) => Boolean(org),
      validate: async (input) => {
        const { error } = orgAttrs.name.required().validate(input);
        if (error) return error;
        return true;
      },
    },
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Are you sure you want to complete this action?',
      default: false,
      when: ({ org }) => Boolean(org),
    },
  ];

  const {
    createOrg,
    confirm,
    org,
    name,
  } = await inquirer.prompt(questions);

  if (createOrg) return create();
  if (!confirm || !org) return null;

  const result = await repos.$('organization').updateName({
    id: org._id,
    name,
  });
  return log(result);
};
