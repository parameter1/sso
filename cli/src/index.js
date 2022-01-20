import inquirer from 'inquirer';
import { immediatelyThrow } from '@parameter1/utils';
import { connect, close } from './mongodb.js';
import createIndexes from './actions/create-indexes.js';
import createUser from './actions/create-user.js';
import registerOrg from './actions/register-org.js';

const { log } = console;

process.on('unhandledRejection', immediatelyThrow);

(async () => {
  const questions = [
    {
      type: 'list',
      name: 'action',
      message: 'Choose an action',
      choices: [
        { name: 'Create database indexes', value: 'createIndexes' },
        { name: 'Create new user', value: 'createUser' },
        { name: 'Register new organization', value: 'registerOrg' },
      ],
    },
  ];

  const { action } = await inquirer.prompt(questions);
  await connect();

  switch (action) {
    case 'createIndexes':
      await createIndexes();
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

  await close();
  log('DONE');
})().catch(immediatelyThrow);
