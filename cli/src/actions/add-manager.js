import inquirer from 'inquirer';
import { asArray } from '@parameter1/utils';
import { organizationAttributes as orgAttrs } from '@parameter1/sso-db/schema';
import { getOrgList, getUserList } from './utils/index.js';
import repos from '../repos.js';

const { log } = console;

export default async function createInstance() {
  const questions = [
    {
      type: 'list',
      name: 'org',
      message: 'Select the organization',
      choices: getOrgList({ projection: { members: 1 } }),
    },
    {
      type: 'list',
      name: 'user',
      message: 'Select the user to add as a mananger',
      choices: async ({ org }) => {
        const managerEmails = asArray(org.managers).reduce((set, manager) => {
          set.add(manager.user.email);
          return set;
        }, new Set());

        return getUserList({
          disabledWhen: (user) => managerEmails.has(user.email),
        });
      },
    },
    {
      type: 'list',
      name: 'role',
      message: 'Select the manager role',
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
    },
  ];

  const {
    confirm,
    org,
    user,
    role,
  } = await inquirer.prompt(questions);

  if (!confirm) return;

  const result = await repos.addOrgManager({
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
}
