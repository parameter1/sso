import { EJSONClient } from '@parameter1/micro-ejson';
import { ENTITY_PROCESSOR_URL } from './env.js';

export default new EJSONClient({ url: ENTITY_PROCESSOR_URL });
