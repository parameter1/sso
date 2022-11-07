import { EJSONClient } from '@parameter1/micro-ejson';
import { USER_URL } from './env.js';

export const userManager = new EJSONClient({ url: USER_URL });
