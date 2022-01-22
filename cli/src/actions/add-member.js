import inquirer from 'inquirer';
import { workspaceAttributes as workspaceAttrs } from '@parameter1/sso-db/schema';
import repos from '../repos.js';

const { log } = console;

export default async function createInstance() {
  const questions = [
    {
      type: 'list',
      name: 'workspace',
      message: 'Select the workspace',
      choices: async () => {
        const cursor = await repos.$('workspace').find({
          query: {},
          options: {
            projection: { namespace: 1, name: 1, slug: 1 },
            sort: { 'name.full': 1 },
          },
        });
        const docs = await cursor.toArray();
        return docs.map((doc) => ({ name: `${doc.name.full} [${doc.namespace}.${doc.slug}]`, value: doc }));
      },
    },
    {
      type: 'list',
      name: 'user',
      message: 'Select the user to add as a member',
      choices: async () => {
        const cursor = await repos.$('user').find({
          query: {},
          options: { projection: { email: 1, name: 1 }, sort: { email: 1 } },
        });
        const docs = await cursor.toArray();
        return docs.map((doc) => ({ name: `${doc.email} [${doc.name.default}]`, value: doc }));
      },
    },
    {
      type: 'list',
      name: 'role',
      message: 'Select the member role',
      // @todo these need to come from the possible app roles
      choices: () => ['Administrator', 'Member'],
      validate: (input) => {
        const { error } = workspaceAttrs.role().required().validate(input);
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
    workspace,
    user,
    role,
  } = await inquirer.prompt(questions);

  if (!confirm) return;

  const result = await repos.addWorkspaceMember({
    workspace: {
      _id: workspace._id,
      namespace: workspace.namespace,
      slug: workspace.slug,
      name: workspace.name,
    },
    user: { _id: user._id, email: user.email, name: user.name },
    role,
  });
  log(result);
}
