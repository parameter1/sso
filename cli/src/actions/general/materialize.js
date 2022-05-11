import inquirer from 'inquirer';
import repos from '../../repos.js';

const pipelineMap = new Set([
  'application',
  'organization',
  'user',
  'workspace',
]);

export default async () => {
  const questions = [
    {
      type: 'checkbox',
      name: 'types',
      message: 'Select the collection types to materialize',
      choices: () => [
        'application',
        'organization',
        'user',
        'workspace',
      ],
      validate: (input) => {
        input.forEach((type) => {
          if (!pipelineMap.has(type)) throw new Error(`No materializer was found for ${type}`);
        });
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

  const { types, confirm } = await inquirer.prompt(questions);

  return confirm ? Promise.all(types.map(async (type) => {
    await repos.$(type).materialize();
    return { [type]: 'ok' };
  })) : [];
};
