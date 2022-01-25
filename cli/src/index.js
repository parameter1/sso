import inquirer from 'inquirer';
import { immediatelyThrow } from '@parameter1/utils';
import { get } from '@parameter1/object-path';
import { connect, close } from './mongodb.js';
import repos from './repos.js';

import actions from './actions/index.js';

const { log } = console;

const hasDocuments = async () => {
  const r = await Promise.all(['application', 'user', 'organization', 'workspace'].map(async (name) => {
    const repo = repos.$(name);
    const doc = await repo.findOne({ query: {}, options: { projection: { _id: 1 } } });
    return { name, hasDocs: Boolean(doc) };
  }));
  return r.reduce((set, { name, hasDocs }) => {
    if (hasDocs) set.add(name);
    return set;
  }, new Set());
};

const run = async () => {
  const documents = await hasDocuments();

  const questions = [
    {
      type: 'list',
      name: 'path',
      message: 'Choose an action',

      choices: [
        {
          key: 'application',
          choices: [
            { name: 'Create new application', fnName: 'create' },
            {
              name: 'Update application name',
              fnName: 'updateName',
              disabled: !documents.has('application') ? 'disabled: no apps exist' : false,
            },
          ],
        },

        {
          key: 'user',
          choices: [
            { name: 'Create new user', fnName: 'create' },
            {
              name: 'Change user email address',
              fnName: 'changeEmail',
              disabled: !documents.has('user') ? 'disabled: no users exist' : false,
            },
            {
              name: 'Update user first/last name',
              fnName: 'updateNames',
              disabled: !documents.has('user') ? 'disabled: no users exist' : false,
            },
            {
              name: 'Generate user auth token (impersonate)',
              value: 'generateAuthToken',
              disabled: !documents.has('user') ? 'disabled: no users exist' : false,
            },
          ],
        },

        {
          key: 'organization',
          choices: [
            { name: 'Create new organization', fnName: 'create' },
            {
              name: 'Update organization name',
              fnName: 'updateName',
              disabled: !documents.has('organization') ? 'disabled: no orgs exist' : false,
            },
            {
              name: 'Add organization manager',
              fnName: 'addManager',
              disabled: !documents.has('organization') || !documents.has('user') ? 'disabled: no orgs or users exist' : false,
            },
          ],
        },

        {
          key: 'workspace',
          choices: [
            {
              name: 'Create new workspace',
              fnName: 'create',
              disabled: !documents.has('application') || !documents.has('organization') ? 'disabled: no apps or orgs exist' : false,
            },
            {
              name: 'Update workspace name',
              fnName: 'updateName',
              disabled: !documents.has('workspace') ? 'disabled: no workspaces exist' : false,
            },
            {
              name: 'Add workspace member',
              fnName: 'addMember',
              disabled: !documents.has('workspace') || !documents.has('user') ? 'disabled: no workspaces or users exist' : false,
            },
          ],
        },

        {
          key: 'general',
          choices: [
            { name: 'Create database indexes', fnName: 'createIndexes' },
          ],
        },
      ].reduce((arr, group) => {
        group.choices.forEach((choice) => {
          const value = `${group.key}.${choice.fnName}`;
          arr.push({ name: choice.name, value, disabled: choice.disabled });
        });
        arr.push(new inquirer.Separator());
        return arr;
      }, [new inquirer.Separator()]),
      loop: false,
    },
  ];

  const { path } = await inquirer.prompt(questions);
  const action = get(actions, path);
  if (!action) throw new Error(`No action found for ${path}`);

  await action();

  log(`> Action '${path}' complete`);

  const { runAnother } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'runAnother',
      message: 'Would you like to run another action?',
      default: true,
    },
  ]);
  if (runAnother) await run();
};

process.on('unhandledRejection', immediatelyThrow);

(async () => {
  await connect();
  await run();
  await close();
  log('> DONE');
})().catch(immediatelyThrow);
