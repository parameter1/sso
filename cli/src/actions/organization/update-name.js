import inquirer from 'inquirer';
import { organizationProps } from '@parameter1/sso-mongodb';
import { getOrgList } from '../utils/index.js';
import repos from '../../repos.js';

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
      name: 'name',
      default: ({ org }) => org.name,
      message: 'Enter the new organization name',
      filter: (input) => {
        const { value } = organizationProps.name.required().validate(input);
        return value;
      },
      validate: async (input) => {
        const { error } = organizationProps.name.validate(input);
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

  return confirm ? repos.$('organization').updateProps({
    id: org._id,
    props: { name },
  }) : null;
};
