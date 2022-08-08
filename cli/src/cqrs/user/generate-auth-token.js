import inquirer from 'inquirer';
import { getUserList } from '../utils/index.js';
import { userManager } from '../../mongodb.js';

export default async () => {
  const questions = [
    {
      type: 'list',
      name: 'user',
      message: 'Select the user to impersonate',
      choices: getUserList,
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
    user,
  } = await inquirer.prompt(questions);
  if (!confirm) return null;

  const loginLinkToken = await userManager.createLoginLinkToken({
    email: user.email,
    impersonated: true,
  });

  const { authToken } = await userManager.magicLogin({
    loginLinkToken,
  });
  return authToken;
};
