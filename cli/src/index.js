import inquirer from 'inquirer';
import { immediatelyThrow } from '@parameter1/utils';
import { connect, close } from './mongodb.js';

import createApplication from './actions/create-application.js';
import createIndexes from './actions/create-indexes.js';
import createUser from './actions/create-user.js';
import registerOrg from './actions/register-org.js';

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
        { name: 'Create user', value: 'createUser' },
        { name: 'Register new organization', value: 'registerOrg' },
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
    case 'createUser':
      await createUser();
      break;
    case 'registerOrg':
      await registerOrg();
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
