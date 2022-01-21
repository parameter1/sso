import inquirer from 'inquirer';
import { managerAttributes as managerAttrs } from '@parameter1/sso-db/schema';
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
          options: { projection: { name: 1, slug: 1 }, sort: { name: 1 } },
        });
        const docs = await cursor.toArray();
        return docs.map((doc) => ({ name: `${doc.name} [${doc.slug}]`, value: doc }));
      },
    },
    {
      type: 'list',
      name: 'user',
      message: 'Select the user to add as a mananger',
      choices: async () => {
        const cursor = await repos.$('user').find({
          query: {},
          options: { projection: { email: 1, name: 1 }, sort: { email: 1 } },
        });
        const docs = await cursor.toArray();
        return docs.map((doc) => ({ name: `${doc.email} [${doc.name.full}]`, value: doc }));
      },
    },
    {
      type: 'list',
      name: 'role',
      message: 'Select the manager role',
      // eslint-disable-next-line
      choices: () => ['Owner', 'Administrator', 'Member'],
      validate: (input) => {
        const { error } = managerAttrs.role.required().validate(input);
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

  const result = await repos.$('manager').create({
    org,
    user: { _id: user._id, email: user.email },
    role,
  });
  log(result);
}
