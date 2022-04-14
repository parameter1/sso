import inquirer from 'inquirer';
import { organizationProps } from '@parameter1/sso-mongodb';
import { getOrgList, getUserList } from '../utils/index.js';
import repos from '../../repos.js';

const { log } = console;

export default async () => {
  const questions = [
    {
      type: 'list',
      name: 'eligible',
      message: 'Select the organization',
      choices: async () => {
        const orgIds = await repos.$('user').distinct({
          key: 'organizations._id',
        });
        return getOrgList({ query: { _id: { $in: orgIds } } });
      },
      filter: async (org) => {
        const users = await getUserList({
          projection: { organizations: 1 },
          query: { 'organizations._id': org._id },
        });
        return { org, users };
      },
    },
    {
      type: 'list',
      name: 'user',
      message: 'Select the user',
      when: ({ eligible }) => Boolean(eligible.users.length),
      choices: async ({ eligible }) => eligible.users,
    },
    {
      type: 'list',
      name: 'role',
      message: 'Select the manager role',
      when: ({ eligible }) => Boolean(eligible.users.length),
      choices: ({ user, eligible }) => {
        const { role } = user.organizations.find(({ _id }) => `${_id}` === `${eligible.org._id}`);
        return ['Owner', 'Administrator', 'Manager'].map((r) => ({
          name: r === role ? `${r} (current role)` : r,
          value: r,
        }));
      },
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
      when: ({ eligible }) => Boolean(eligible.users.length),
    },
  ];

  const {
    confirm,
    eligible,
    user,
    role,
  } = await inquirer.prompt(questions);

  if (!user) {
    log('> No eligible users were found for this organization');
    return null;
  }

  const { org } = eligible;
  return confirm ? repos.$('user').changeOrgRole({
    orgId: org._id,
    userId: user._id,
    role,
  }) : null;
};
