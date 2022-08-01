import { MongoDBClient, filterMongoURL, EntityManager } from '@parameter1/sso-mongodb';
import { MONGO_URL } from './env.js';
import pkg from '../package.js';

const { log } = console;

const mongodb = new MongoDBClient({
  url: MONGO_URL,
  options: { appname: `${pkg.name} v${pkg.version}` },
});

export default mongodb;

export const entityManager = new EntityManager({ client: mongodb });

export const connect = async () => {
  log('> Conecting to MongoDB...');
  const client = await mongodb.connect();
  log(`> MongoDB connected. ${filterMongoURL(client)}`);
};

export const close = async () => {
  log('> Closing MongoDB...');
  await mongodb.close();
  log('> MongoDB closed.');
};
