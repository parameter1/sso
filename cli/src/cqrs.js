import inquirer from 'inquirer';
import { immediatelyThrow } from '@parameter1/utils';
import { get } from '@parameter1/object-path';
import { connect, close } from './mongodb.js';

import actions from './actions.js';

process.on('unhandledRejection', immediatelyThrow);

const { log } = console;

const run = async () => {
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
  await connect();
  await run();
  await close();
  log('> DONE');
})().catch(immediatelyThrow);
