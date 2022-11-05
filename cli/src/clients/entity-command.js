import { ejsonClient } from '@parameter1/sso-micro-ejson';
import { ENTITY_COMMAND_URL } from '../env.js';

export const entityCommandClient = ejsonClient({ url: ENTITY_COMMAND_URL });
