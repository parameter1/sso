import { EJSONClient } from '@parameter1/micro-ejson';
import { ENTITY_COMMAND_URL, USER_URL } from './env.js';

export const commands = new EJSONClient({ url: ENTITY_COMMAND_URL });
export const userManager = new EJSONClient({ url: USER_URL });
