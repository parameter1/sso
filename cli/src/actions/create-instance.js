import inquirer from 'inquirer';
import repos from '../repos.js';

const { log } = console;

export default async function createInstance() {
  const questions = [
    {
      type: 'list',
      name: 'app',
      message: 'Select the application to add the organization to',
      choices: async () => {
        const cursor = await repos.$('application').find({
          query: {},
          options: { projection: { name: 1, slug: 1 }, sort: { name: 1 } },
        });
        const docs = await cursor.toArray();
        return docs.map((doc) => ({ name: `${doc.name} [${doc.slug}]`, value: doc }));
      },
    },
    {
      type: 'list',
      name: 'org',
      message: 'Select the organization to add',
      choices: async ({ app }) => {
        // exclude instances that already exist.
        const excludeOrgIds = await repos.$('instance').distinct({
          key: 'org.node._id',
          query: { 'app.node._id': app._id },
        });
        const cursor = await repos.$('organization').find({
          query: { _id: { $nin: excludeOrgIds } },
          options: { projection: { name: 1, slug: 1 }, sort: { name: 1 } },
        });
        const docs = await cursor.toArray();
        return docs.map((doc) => ({ name: `${doc.name} [${doc.slug}]`, value: doc }));
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
    app,
    org,
  } = await inquirer.prompt(questions);

  if (!confirm) return;

  const result = await repos.$('instance').create({ app, org });
  log(result);
}
