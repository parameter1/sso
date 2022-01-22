import inquirer from 'inquirer';
import { workspaceAttributes as workspaceAttrs } from '@parameter1/sso-db/schema';
import { sluggify } from '@parameter1/slug';
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
      type: 'input',
      name: 'name',
      message: 'Enter the name for the workspace',
      default: 'Default',
    },
    {
      type: 'input',
      name: 'slug',
      message: 'Enter the workspace slug key',
      default: ({ name }) => sluggify(name),
      validate: (input) => {
        const { error } = workspaceAttrs.slug.required().validate(input);
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
    app,
    org,
    name,
    slug,
  } = await inquirer.prompt(questions);

  if (!confirm) return;

  const result = await repos.$('workspace').create({
    app: { _id: app._id, slug: app.slug, name: app.name },
    org: { _id: org._id, slug: org.slug, name: org.name },
    slug,
    name,
  });
  log(result);
}
