import inquirer from 'inquirer';
import { asArray } from '@parameter1/utils';
import { organizationAttributes as orgAttrs } from '@parameter1/sso-db/schema';
import repos from '../repos.js';

const { log } = console;

export default async function createInstance() {
  const questions = [
    {
      type: 'list',
      name: 'org',
      message: 'Select the organization',
      choices: async () => {
        const cursor = await repos.$('organization').find({
          query: {},
          options: { projection: { name: 1, slug: 1, managers: 1 }, sort: { name: 1 } },
        });
        const docs = await cursor.toArray();
        return docs.map((doc) => ({ name: `${doc.name} [${doc.slug}]`, value: doc }));
      },
    },
    {
      type: 'list',
      name: 'user',
      message: 'Select the user to add as a mananger',
      choices: async ({ org }) => {
        const cursor = await repos.$('user').find({
          query: {},
          options: { projection: { email: 1, name: 1 }, sort: { email: 1 } },
        });

        const managerEmails = asArray(org.managers).reduce((set, manager) => {
          set.add(manager.user.email);
          return set;
        }, new Set());

        const users = await cursor.toArray();
        return users.map((doc) => ({
          name: `${doc.email} [${doc.name.default}]`,
          value: doc,
          disabled: managerEmails.has(doc.email),
        }));
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
    user: { _id: user._id, email: user.email, name: user.name },
    role,
  });
  log(result);
}
