import inquirer from 'inquirer';
import { organizationProps } from '@parameter1/sso-mongodb';
import { getOrgList, getUserList } from '../utils/index.js';
import repos from '../../repos.js';

export default async () => {
  const questions = [
    {
      type: 'list',
      name: 'org',
      message: 'Select the organization',
      choices: () => getOrgList(),
    },

    {
      type: 'list',
      name: 'user',
      message: 'Select the user',
      choices: async ({ org }) => getUserList({
        query: { 'organizations._id': { $ne: org._id } },
      }),
    },

    {
      type: 'list',
      name: 'role',
      message: 'Select the manager role',
      choices: () => ['Owner', 'Administrator', 'Manager'],
      filter: (input) => {
        const { value } = organizationProps.managerRole.required().validate(input);
        return value;
      },
      validate: (input) => {
        const { error } = organizationProps.managerRole.required().validate(input);
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
    user,
    role,
  } = await inquirer.prompt(questions);

  return confirm ? repos.$('user').manageOrg({
    userId: user._id,
    orgId: org._id,
    role,
  }) : null;
};
