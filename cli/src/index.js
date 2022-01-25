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
              disabled: !documents.has('application'),
            },
            {
              name: 'Update application slug',
              fnName: 'updateSlug',
              disabled: !documents.has('application'),
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
              disabled: !documents.has('user'),
            },
            {
              name: 'Update user first/last name',
              fnName: 'updateNames',
              disabled: !documents.has('user'),
            },
            {
              name: 'Generate user auth token (impersonate)',
              value: 'generateAuthToken',
              disabled: !documents.has('user'),
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
              disabled: !documents.has('organization'),
            },
            {
              name: 'Update organization slug',
              fnName: 'updateSlug',
              disabled: !documents.has('organization'),
            },
            {
              name: 'Add organization manager',
              fnName: 'addManager',
              disabled: !documents.has('organization') || !documents.has('user'),
            },
          ],
        },

        {
          key: 'workspace',
          choices: [
            {
              name: 'Create new workspace',
              fnName: 'create',
              disabled: !documents.has('application') || !documents.has('organization'),
            },
            {
              name: 'Update workspace name',
              fnName: 'updateName',
              disabled: !documents.has('workspace'),
            },
            {
              name: 'Update workspace slug',
              fnName: 'updateSlug',
              disabled: !documents.has('workspace'),
            },
            {
              name: 'Add workspace member',
              fnName: 'addMember',
              disabled: !documents.has('workspace') || !documents.has('user'),
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
        let count = 0;
        group.choices.forEach((choice) => {
          const value = `${group.key}.${choice.fnName}`;
          if (!choice.disabled) {
            arr.push({ name: choice.name, value });
            count += 1;
          }
        });
        if (count) arr.push(new inquirer.Separator());
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
