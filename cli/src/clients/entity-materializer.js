import { ejsonClient } from '@parameter1/sso-micro-ejson';
import { ENTITY_MATERIALIZER_URL } from '../env.js';

export const entityMaterializerClient = ejsonClient({ url: ENTITY_MATERIALIZER_URL });
