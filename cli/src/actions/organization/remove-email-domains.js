import inquirer from 'inquirer';
import { getOrgList } from '../utils/index.js';
import repos from '../../repos.js';

const { log } = console;

export default async () => {
  const questions = [
    {
      type: 'list',
      name: 'org',
      message: 'Select the organization',
      choices: () => getOrgList({ projection: { emailDomains: 1 } }),
    },
    {
      type: 'checkbox',
      name: 'emailDomains',
      message: 'Select the email domains to remove',
      when: ({ org }) => Boolean(org.emailDomains.length),
      choices: ({ org }) => org.emailDomains.sort(),
    },
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Are you sure you want to complete this action?',
      default: false,
      when: ({ org }) => Boolean(org.emailDomains.length),
    },
  ];

  const {
    confirm,
    org,
    emailDomains,
  } = await inquirer.prompt(questions);

  if (!emailDomains || !emailDomains.length) return;
  if (!confirm) return;

  const result = await repos.$('organization').removeEmailDomains({
    id: org._id,
    emailDomains,
  });
  log(result);
};
