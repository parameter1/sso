import { materializer, normalizer } from '../mongodb.js';
import { commands } from '../service-clients.js';

const { log } = console;

const disabledDomains = new Set(['southcomm.com', 'cygnus.com', 'endeavorb2b.com', 'endeavorbusinessmedia.com']);

/**
 *
 * @param {object} params
 * @param {import("../org-manager.js").OrgManager} params.orgManager
 * @param {boolean} [params.skip=false]
 * @returns {Promise<Map<string, string[]>}
 */
export async function upsertUsers({ orgManager, skip }) {
  const sources = orgManager.getAllSources();

  const usersByEmailMap = new Map();
  await Promise.all(sources.map(async ({
    org,
    workspace,
    source,
  }) => {
    const { kind } = source;
    const users = await source.loadUsers();
    users.forEach((user) => {
      if (!user.email) {
        log({ kind, key: source.key, user });
        throw new Error('no email');
      }
      if (!user.familyName) {
        log({ kind, key: source.key, user });
        throw new Error('no familyName');
      }
      if (!user.givenName) {
        log({ kind, key: source.key, user });
        throw new Error('no givenName');
      }
      const email = user.email.toLowerCase().trim();
      if (!usersByEmailMap.has(email)) usersByEmailMap.set(email, []);
      usersByEmailMap.get(email).push({
        _id: user._id,
        deleted: user.deleted,
        disabled: Boolean(user.disabled),
        provider: kind,
        tenant: source.key,
        org: org.key,
        workspace: workspace.key,
        familyName: user.familyName,
        givenName: user.givenName,
        updatedAt: user.updatedAt,
      });
    });
  }));

  const resolved = [];

  const createUserSource = ({ _id, provider, tenant }) => {
    const type = 'user';
    const entity = `${provider}.${tenant}.user*${_id}`;
    return {
      _id: { value: _id },
      ns: { provider, tenant, type },
      entity,
    };
  };

  const mergeUsers = ({
    email,
    users,
    winner,
    disabled,
  }) => ({
    _sync: {
      sources: [...users.map(createUserSource).reduce((map, source) => {
        map.set(source.entity, source);
        return map;
      }, new Map()).values()],
    },
    values: {
      disabled,
      email,
      familyName: winner.familyName,
      givenName: winner.givenName,
    },
    // users must be globally enabled and not be deleted to be in a workspace.
    workspaces: [...users.filter((user) => !disabled && !user.deleted).map(({ org, workspace }) => `${org}/${workspace}`).reduce((set, ns) => {
      set.add(ns);
      return set;
    }, new Set())],
  });

  usersByEmailMap.forEach((users, email) => {
    const [, domain] = email.split('@');
    const disabled = disabledDomains.has(domain);
    if (users.length === 1) {
      resolved.push(mergeUsers({
        email,
        users,
        winner: users[0],
        disabled,
      }));
      return;
    }

    const nameCounts = new Map();
    users.forEach((user) => {
      const name = `${user.givenName} ${user.familyName}`;
      if (!nameCounts.has(name)) nameCounts.set(name, 0);
      nameCounts.set(name, nameCounts.get(name) + 1);
    });
    if (nameCounts.size === 1) {
      // one name, use the first user for data.
      resolved.push(mergeUsers({
        email,
        users,
        winner: users[0],
        disabled,
      }));
      return;
    }

    const counts = [...nameCounts]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    const countValues = new Set(counts.map(({ value }) => value));
    if (countValues.size === 1) {
      // all the counts are the same, pick the newest record as the "winner"
      const [winner] = users.sort((a, b) => b.updatedAt.valueOf() - a.updatedAt.valueOf());
      resolved.push(mergeUsers({
        email,
        users,
        winner,
        disabled,
      }));
      return;
    }
    // otherwise, pick the user with the most similar names
    const { name } = counts[0];
    const winner = users.find(({ givenName, familyName }) => `${givenName} ${familyName}` === name);
    resolved.push(mergeUsers({
      email,
      users,
      winner,
      disabled,
    }));
  });

  const emailToWorkspaceMap = new Map();
  const input = resolved.map(({ workspaces, ...user }) => {
    if (workspaces.length) {
      emailToWorkspaceMap.set(user.values.email, workspaces);
    }
    return user;
  });

  if (skip) return emailToWorkspaceMap;

  const results = await commands.request('user.create', {
    input,
    upsert: true,
  });

  const userIds = [];
  results.forEach(({ entityId }) => {
    userIds.push(entityId);
  }, new Map());

  // then normalize/materialize.
  await normalizer.normalize({ entityIds: userIds, entityType: 'user' });
  await materializer.materialize('user', { entityIds: userIds });

  return emailToWorkspaceMap;
}
