import inquirer from 'inquirer';
import { asArray } from '@parameter1/utils';
import { organizationAttributes as orgAttrs } from '@parameter1/sso-db/schema';
import { getOrgList, getUserList } from '../utils/index.js';
import repos from '../../repos.js';

const { log } = console;

export default async () => {
  const questions = [
    {
      type: 'list',
      name: 'eligible',
      message: 'Select the organization',
      choices: () => getOrgList({ projection: { managers: 1 } }),
      filter: async (org) => {
        const managerEmails = asArray(org.managers).reduce((set, manager) => {
          set.add(manager.user.email);
          return set;
        }, new Set());

        const users = await getUserList({
          query: { email: { $nin: [...managerEmails] } },
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
      choices: () => ['Owner', 'Administrator'],
      validate: (input) => {
        const { error } = orgAttrs.managerRole.required().validate(input);
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
    return;
  }

  if (!confirm) return;

  const { org } = eligible;
  const result = await repos.$('organization').addManager({
    org: { _id: org._id, slug: org.slug, name: org.name },
    user: {
      _id: user._id,
      email: user.email,
      givenName: user.givenName,
      familyName: user.familyName,
    },
    role,
  });
  log(result);
};
