import { ejsonClient } from '@parameter1/sso-micro-ejson';
import { ENTITY_NORMALIZER_URL } from '../env.js';

export const entityNormalizerClient = ejsonClient({ url: ENTITY_NORMALIZER_URL });
