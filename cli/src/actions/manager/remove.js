import inquirer from 'inquirer';
import { getOrgList, getUserList } from '../utils/index.js';
import repos from '../../repos.js';

export default async () => {
  const questions = [
    {
      type: 'list',
      name: 'org',
      message: 'Select the organization',
      choices: async () => {
        const orgIds = await repos.$('manager').distinct({
          key: 'organization._id',
        });
        return getOrgList({ query: { _id: { $in: orgIds } } });
      },
    },

    {
      type: 'list',
      name: 'user',
      message: 'Select the user',
      choices: async ({ org }) => {
        const userIds = await repos.$('manager').distinct({
          key: 'user._id',
          query: { 'organization._id': org._id },
        });
        return getUserList({ query: { _id: { $in: userIds } } });
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
  } = await inquirer.prompt(questions);

  return confirm ? repos.$('manager').removeManager({
    orgId: org._id,
    userId: user._id,
  }) : null;
};
