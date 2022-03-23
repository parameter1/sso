import inquirer from 'inquirer';
import getUserList from '../utils/get-user-list.js';
import repos from '../../repos.js';

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

  const loginLinkToken = await repos.$('user').createLoginLinkToken({
    userId: user._id,
    impersonated: true,
  });
  const { authToken } = await repos.$('user').magicLogin({ loginLinkToken });
  return authToken;
};
