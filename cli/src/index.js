import inquirer from 'inquirer';
import { immediatelyThrow } from '@parameter1/utils';
import { get } from '@parameter1/object-path';
import { connect, close } from './mongodb.js';

import actions from './actions/index.js';

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
            { name: 'Update application name', fnName: 'updateName' },
          ],
        },

        {
          key: 'user',
          choices: [
            { name: 'Create new user', fnName: 'create' },
            { name: 'Change user email address', fnName: 'changeEmail' },
            { name: 'Update user first/last name', fnName: 'updateNames' },
            { name: 'Generate user auth token (impersonate)', value: 'generateAuthToken' },
          ],
        },

        {
          key: 'organization',
          choices: [
            { name: 'Create new organization', fnName: 'create' },
            { name: 'Update organization name', fnName: 'updateName' },
            { name: 'Add organization manager', fnName: 'addManager' },
          ],
        },

        {
          key: 'workspace',
          choices: [
            { name: 'Create new workspace', fnName: 'create' },
            { name: 'Update workspace name', fnName: 'updateName' },
            { name: 'Add workspace member', fnName: 'addMember' },
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
          arr.push({ name: choice.name, value });
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

  log(`Action '${path}' complete`);

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
  log('DONE');
})().catch(immediatelyThrow);
