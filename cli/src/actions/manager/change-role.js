import inquirer from 'inquirer';
// import { managerProps } from '@parameter1/sso-mongodb';
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
      type: 'list',
      name: 'role',
      message: 'Select the manager role',
      choices: async ({ org, user }) => {
        const manager = await repos.$('manager').findOne({
          query: { 'user._id': user._id, 'organization._id': org._id },
        });
        return ['Owner', 'Administrator', 'Manager'].map((r) => ({
          name: r === manager.role ? `${r} (current role)` : r,
          value: r,
        }));
      },
      filter: (input) => {
        const { value } = managerProps.role.required().validate(input);
        return value;
      },
      validate: (input) => {
        const { error } = managerProps.role.required().validate(input);
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

  return confirm ? repos.$('manager').changeRole({
    orgId: org._id,
    userId: user._id,
    role,
  }) : null;
};
