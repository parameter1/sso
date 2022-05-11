import { MaterializedRepos } from '@parameter1/sso-mongodb';
import client from '../mongodb.js';

export default new MaterializedRepos({ client });
