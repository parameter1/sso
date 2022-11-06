import inquirer from 'inquirer';
import { workspaceProps } from '@parameter1/sso-mongodb-command';
import { sluggify } from '@parameter1/slug';

import { getAppList, getOrgList } from '../utils/index.js';
import { workspaceCommands, materializedRepoManager } from '../../mongodb.js';
import { waitUntilProcessed } from '../../pubsub.js';

const repo = materializedRepoManager.get('workspace');

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
        const doc = await repo.collection.findOne({
          '_edge.organization.node._id': org._id,
          '_edge.application.node._id': app._id,
          key: input,
        }, { projection: { _id: 1 } });
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

  return waitUntilProcessed(() => workspaceCommands.create({
    input: [{
      values: {
        appId: app._id,
        name,
        orgId: org._id,
        key,
      },
    }],
  }));
};
