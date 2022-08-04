import inquirer from 'inquirer';
import { sluggify } from '@parameter1/slug';
import { workspaceCommandProps } from '@parameter1/sso-mongodb';
import { entityManager } from '../../mongodb.js';
import { getAppList, getOrgList, waitUntilProcessed } from '../utils/index.js';

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
        const { value } = workspaceCommandProps.name.required().validate(input);
        return value;
      },
      validate: (input) => {
        const { error } = workspaceCommandProps.name.required().validate(input);
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
        const { value } = workspaceCommandProps.key.required().validate(input);
        return value;
      },
      validate: async (input, { app, org }) => {
        const { error } = workspaceCommandProps.key.required().validate(input);
        if (error) return error;
        const doc = await entityManager.getMaterializedRepo('workspace').findOne({
          query: {
            '_edge.organization.node._id': org._id,
            '_edge.application.node._id': app._id,
            key: input,
          },
          options: { projection: { _id: 1 } },
        });
        if (doc) return new Error('A workspace already exists with this key');
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
    app,
    org,
    name,
    key,
  } = await inquirer.prompt(questions);
  if (!confirm) return null;

  const handler = entityManager.getCommandHandler('workspace');
  return waitUntilProcessed(() => handler.create({
    values: {
      appId: app._id,
      name,
      orgId: org._id,
      key,
    },
  }));
};
