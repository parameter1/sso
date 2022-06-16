import application from './handlers/application.js';
import organization from './handlers/organization.js';
import user from './handlers/user.js';
import workspace from './handlers/workspace.js';

const map = new Map([
  ['applications', application],
  ['organizations', organization],
  ['users', user],
  ['workspaces', workspace],
]);

export async function runHandlerFor(change) {
  const { ns, operationType } = change;

  const handlers = map.get(ns.coll);
  if (!handlers) return null;

  const handler = handlers[operationType];
  if (typeof handler !== 'function') return null;

  return handler({ change });
}
