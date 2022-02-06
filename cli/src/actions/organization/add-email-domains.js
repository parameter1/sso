import inquirer from 'inquirer';
import Joi from '@parameter1/joi';
import { organizationAttributes as orgAttrs } from '@parameter1/sso-db/schema';
import { getOrgList } from '../utils/index.js';
import repos from '../../repos.js';

const { log } = console;

export default async () => {
  const questions = [
    {
      type: 'list',
      name: 'org',
      message: 'Select the organization',
      choices: getOrgList,
    },
    {
      type: 'input',
      name: 'emailDomains',
      message: 'Enter comma separated list of organization email domains',
      filter: (list) => list.split(',').map((v) => v.trim()).filter((v) => v),
      validate: (domains) => {
        const { error } = Joi.array()
          .items(orgAttrs.emailDomain.required())
          .required()
          .validate(domains);
        if (error) return error;
        return true;
      },
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
    org,
    emailDomains,
  } = await inquirer.prompt(questions);

  if (!confirm) return;

  const result = await repos.$('organization').updateAttributes({
    id: org._id,
    emailDomains: {
      values: emailDomains,
      mode: 'addToSet',
    },
  });
  log(result);
};
