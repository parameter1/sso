import {
  buildMaterializedApplicationPipeline,
  buildMaterializedOrganizationPipeline,
  buildMaterializedUserPipeline,
  buildMaterializedWorkspacePipeline,
} from '@parameter1/sso-mongodb';
import mongodb from './mongodb.js';

const pipelineBuilders = new Map([
  ['applications', buildMaterializedApplicationPipeline],
  ['organizations', buildMaterializedOrganizationPipeline],
  ['users', buildMaterializedUserPipeline],
  ['workspaces', buildMaterializedWorkspacePipeline],
]);

export async function getManagedCollection({ db, coll }) {
  return mongodb.collection({ dbName: db, name: coll });
}

export async function getMaterializedCollection({ db, coll }) {
  return mongodb.collection({ dbName: db, name: `${coll}/materialized` });
}

export async function deleteMaterializedRecord({ db, coll, _id }) {
  const materializedCollection = await getMaterializedCollection({ db, coll });
  return materializedCollection.deleteOne({ _id });
}

export async function materializeData({ db, coll }, filter = {}) {
  const builder = pipelineBuilders.get(coll);
  if (!builder) throw new Error(`No materialized pipeline builder was found for ${coll}`);
  const pipeline = builder({ $match: filter });
  const managedCollection = await getManagedCollection({ db, coll });
  const cursor = await managedCollection.aggregate(pipeline);
  return cursor.toArray();
}
