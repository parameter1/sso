import { EntityCommandServiceClient } from '@parameter1/sso-service-client-entity-command';
import { EntityMaterializerServiceClient } from '@parameter1/sso-service-client-entity-materializer';
import { EntityNormalizerServiceClient } from '@parameter1/sso-service-client-entity-normalizer';

import { ENTITY_COMMAND_URL, ENTITY_MATERIALIZER_URL, ENTITY_NORMALIZER_URL } from './env.js';

export const entityCommandClient = new EntityCommandServiceClient({
  url: ENTITY_COMMAND_URL,
});
export const entityMaterializerClient = new EntityMaterializerServiceClient({
  url: ENTITY_MATERIALIZER_URL,
});
export const entityNormalizerClient = new EntityNormalizerServiceClient({
  url: ENTITY_NORMALIZER_URL,
});
