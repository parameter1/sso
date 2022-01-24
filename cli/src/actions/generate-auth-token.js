import inquirer from 'inquirer';
import repos from '../repos.js';

const { log } = console;

export default async function createInstance() {
  const questions = [
    {
      type: 'list',
      name: 'user',
      message: 'Select the user to impersonate',
      choices: async () => {
        const cursor = await repos.$('user').find({
          query: {},
          options: {
            projection: { email: 1, name: 1 },
            sort: { 'name.family': 1 },
          },
        });

        const users = await cursor.toArray();
        return users.map((doc) => ({
          name: `${doc.name.family}, ${doc.name.given} [${doc.email}]`,
          value: doc,
        }));
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
    user,
  } = await inquirer.prompt(questions);

  if (!confirm) return;

  const loginLinkToken = await repos.$('user').createLoginLinkToken({
    email: user.email,
    impersonated: true,
  });

  const { authToken } = await repos.$('user').magicLogin({ loginLinkToken });

  log({ authToken });
}
