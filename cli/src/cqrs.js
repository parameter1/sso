import inquirer from 'inquirer';
import { immediatelyThrow } from '@parameter1/utils';
import { get } from '@parameter1/object-path';
import { connect, close, entityManager } from './mongodb.js';
import { pubSubManager } from './pubsub.js';

import actions from './actions.js';

process.on('unhandledRejection', immediatelyThrow);

const { log } = console;

const hasDocuments = async () => {
  const r = await Promise.all(['application', 'organization', 'user'].map(async (entityType) => {
    const repo = entityManager.getMaterializedRepo(entityType);
    const doc = await repo.findOne({ query: {}, options: { projection: { _id: 1 } } });
    return { entityType, hasDocs: Boolean(doc) };
  }));
  return r.reduce((set, { entityType, hasDocs }) => {
    if (hasDocs) set.add(entityType);
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
              name: 'Change user first/last name',
              fnName: 'changeName',
              disabled: !documents.has('user'),
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
  if (r !== null) log(r);

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
    connect(),
    (async () => {
      log('> Connecting to Redis pub/sub...');
      await pubSubManager.connect();
      log('> Redis pub/sub connected.');
    })(),
  ]);

  await run();

  await Promise.all([
    close(),
    (async () => {
      log('> Closing Redis pub/sub...');
      await pubSubManager.quit();
      log('> Redis pub/sub closed.');
    })(),
  ]);
  log('> DONE');
})().catch(immediatelyThrow);
