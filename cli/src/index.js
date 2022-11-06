import inquirer from 'inquirer';
import { immediatelyThrow } from '@parameter1/utils';
import { get } from '@parameter1/object-path';
import { filterMongoURL } from '@parameter1/sso-mongodb-core';
import { inspect } from 'util';

import { mongo, normalizedRepoManager } from './mongodb.js';
import { pubSubManager } from './pubsub.js';

import actions from './actions.js';

process.on('unhandledRejection', immediatelyThrow);

const { log } = console;

const hasDocuments = async () => {
  const r = await Promise.all([
    { entityType: 'application', deleted: false },
    { entityType: 'manager', deleted: false },
    // { entityType: 'member', deleted: false },
    { entityType: 'organization', deleted: false },
    { entityType: 'user', deleted: false },
    { entityType: 'user', deleted: true },
    // { entityType: 'workspace', deleted: false },
  ].map(async ({ entityType, deleted }) => {
    const key = deleted ? `${entityType}_deleted` : entityType;
    const repo = normalizedRepoManager.get(entityType);
    const doc = await repo.collection.findOne({ _deleted: deleted }, {
      projection: { _id: 1 },
    });
    return { key, hasDocs: Boolean(doc) };
  }));
  return r.reduce((set, { key, hasDocs }) => {
    if (hasDocs) set.add(key);
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
              name: 'Change application name',
              fnName: 'changeName',
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
              name: 'Change user first/last name',
              fnName: 'changeName',
              disabled: !documents.has('user'),
            },
            // {
            //   name: 'Generate user auth token (impersonate)',
            //   fnName: 'generateAuthToken',
            //   disabled: !documents.has('user'),
            // },
            {
              name: 'Delete user',
              fnName: 'delete',
              disabled: !documents.has('user'),
            },
            {
              name: 'Restore user',
              fnName: 'restore',
              disabled: !documents.has('user_deleted'),
            },
          ],
        },

        {
          key: 'organization',
          choices: [
            { name: 'Create new organization', fnName: 'create' },
            {
              name: 'Change organization name',
              fnName: 'changeName',
              disabled: !documents.has('organization'),
            },
          ],
        },

        {
          key: 'manager',
          choices: [
            {
              name: 'Create organization manager',
              fnName: 'create',
              disabled: !documents.has('organization') || !documents.has('user'),
            },
            {
              name: 'Change manager role',
              fnName: 'changeRole',
              disabled: !documents.has('manager'),
            },
            {
              name: 'Delete organization manager',
              fnName: 'delete',
              disabled: !documents.has('manager'),
            },
          ],
        },

        // {
        //   key: 'workspace',
        //   choices: [
        //     {
        //       name: 'Create new workspace',
        //       fnName: 'create',
        //       disabled: !documents.has('application') || !documents.has('organization'),
        //     },
        //     {
        //       name: 'Change workspace name',
        //       fnName: 'changeName',
        //       disabled: !documents.has('workspace'),
        //     },
        //   ],
        // },

        // {
        //   key: 'member',
        //   choices: [
        //     {
        //       name: 'Create workspace member',
        //       fnName: 'create',
        //       disabled: !documents.has('workspace') || !documents.has('user'),
        //     },
        //     {
        //       name: 'Change member role',
        //       fnName: 'changeRole',
        //       disabled: !documents.has('member'),
        //     },
        //     {
        //       name: 'Delete workspace member',
        //       fnName: 'delete',
        //       disabled: !documents.has('member'),
        //     },
        //   ],
        // },

        {
          key: 'general',
          choices: [
            { name: 'Create database indexes', fnName: 'createIndexes' },
            { name: 'Normalize event data', fnName: 'normalize' },
            { name: 'Materialize objects', fnName: 'materialize' },
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
    },
  ];

  const { path } = await inquirer.prompt(questions);
  const action = get(actions, path);
  if (!action) throw new Error(`No action found for ${path}`);

  const r = await action();
  if (r !== null) log(inspect(r, { colors: true, depth: null }));

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

(async () => {
  await Promise.all([
    (async () => {
      log('> Connecting to MongoDB...');
      await mongo.connect();
      log(`> MongoDB connection to ${filterMongoURL(mongo)}`);
    })(),
    (async () => {
      log('> Connecting to Redis pub/sub...');
      await pubSubManager.connect();
      log('> Redis pub/sub connected.');
    })(),
  ]);

  await run();

  await Promise.all([
    (async () => {
      log('> Closing to MongoDB...');
      await mongo.close();
      log('> MongoDB closed');
    })(),
    (async () => {
      log('> Closing Redis pub/sub...');
      await pubSubManager.quit();
      log('> Redis pub/sub closed.');
    })(),
  ]);
  log('> DONE');
})().catch(immediatelyThrow);
