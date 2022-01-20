import inquirer from 'inquirer';
import { immediatelyThrow } from '@parameter1/utils';
import { connect, close } from './mongodb.js';

import {
  createApplication,
  createIndexes,
  createOrganization,
  createUser,
} from './actions/index.js';

const { log } = console;

const run = async () => {
  const questions = [
    {
      type: 'list',
      name: 'action',
      message: 'Choose an action',
      choices: [
        { name: 'Create database indexes', value: 'createIndexes' },
        { name: 'Create application', value: 'createApplication' },
        { name: 'Create organization', value: 'createOrganization' },
        { name: 'Create user', value: 'createUser' },
      ],
    },
  ];

  const { action } = await inquirer.prompt(questions);

  switch (action) {
    case 'createIndexes':
      await createIndexes();
      break;
    case 'createApplication':
      await createApplication();
      break;
    case 'createOrganization':
      await createOrganization();
      break;
    case 'createUser':
      await createUser();
      break;
    default:
      throw new Error(`No action found for ${action}`);
  }

  log(`Action '${action}' complete`);

  const { runAnother } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'runAnother',
      message: 'Would you like to run another action?',
      default: false,
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
