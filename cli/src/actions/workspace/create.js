import inquirer from 'inquirer';
import { workspaceProps } from '@parameter1/sso-mongodb';
import { sluggify } from '@parameter1/slug';
import { getAppList, getOrgList } from '../utils/index.js';
import repos from '../../repos.js';

export default async () => {
  const questions = [
    {
      type: 'list',
      name: 'app',
      message: 'Select the application',
      choices: getAppList,
    },
    {
      type: 'list',
      name: 'org',
      message: 'Select the organization',
      choices: getOrgList,
    },
    {
      type: 'input',
      name: 'name',
      message: 'Enter the workspace name',
      default: 'Default',
      filter: (input) => {
        const { value } = workspaceProps.name.required().validate(input);
        return value;
      },
      validate: (input) => {
        const { error } = workspaceProps.name.required().validate(input);
        if (error) return error;
        return true;
      },
    },
    {
      type: 'input',
      name: 'key',
      message: 'Enter the workspace key',
      default: ({ name }) => sluggify(name),
      filter: (input) => {
        const { value } = workspaceProps.key.required().validate(input);
        return value;
      },
      validate: async (input, { app, org }) => {
        const { error } = workspaceProps.key.required().validate(input);
        if (error) return error;

        const doc = await repos.$('workspace').findOne({
          query: {
            'organization._id': org._id,
            'application._id': app._id,
            key: input,
          },
          options: { projection: { _id: 1 } },
        });
        if (doc) return new Error('A workspace already exists with this slug');
        return true;
      },
    },
    // ...environments.map((env) => ({
    //   type: 'input',
    //   name: `urls.${env}`,
    //   message: `Enter the ${env} app URL`,
    //   validate: async (input) => {
    //     const { error } = await workspaceAttrs.url.required().validateAsync(input);
    //     if (error) return error;
    //     return true;
    //   },
    // })),
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Are you sure you want to complete this action?',
      default: false,
    },
  ];

  const {
    confirm,
    app,
    org,
    name,
    key,
    // urls,
  } = await inquirer.prompt(questions);

  return confirm ? repos.$('workspace').create({
    doc: {
      _edge: {
        application: { _id: app._id },
        organization: { _id: org._id },
      },
      key,
      name,
    },
  }) : null;
};
