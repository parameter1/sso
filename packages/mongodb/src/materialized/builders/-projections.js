export function asArray(pathOrExpr) {
  return { $cond: [{ $isArray: pathOrExpr }, pathOrExpr, []] };
}

export function withDefaultValue(pathOrExpr, def = null) {
  return { $ifNull: [pathOrExpr, def] };
}

export function prepareProjection(projection, defaults = {}) {
  return Object
    .keys(projection).sort().reduce((o, key) => {
      const v = projection[key];
      let value = v;
      // @todo handle edge and connection fields
      if (v === 1) value = withDefaultValue(`$${key}`);
      if (typeof v === 'string') value = withDefaultValue(value);
      return { ...o, [key]: value };
    }, { ...defaults });
}

export function projectAsNode(projection) {
  const node = prepareProjection(projection, { _id: '$_id' });
  return { _id: 0, node };
}

function commonFullProjection() {
  return prepareProjection({
    _deleted: 1,
    _history: asArray('$_history'),
    _meta: 1,
  });
}

function commonPartialProjection() {
  return prepareProjection({
    _deleted: 1,
    _meta: 1,
  });
}

export function commonApplication() {
  return prepareProjection({
    key: 1,
    name: 1,
    roles: asArray('$roles'),
    slug: 1,
  });
}

export function fullApplication() {
  return prepareProjection({
    ...commonFullProjection(),
    ...commonApplication(),
  });
}

export function partialApplication() {
  return prepareProjection({
    ...commonPartialProjection(),
    ...commonApplication(),
  });
}

export function commonOrganization() {
  return prepareProjection({
    emailDomains: asArray('$emailDomains'),
    key: 1,
    name: 1,
    slug: 1,
  });
}

export function fullOrganization() {
  return prepareProjection({
    ...commonFullProjection(),
    ...commonOrganization(),
    '_connection.manager': 1,
  });
}

export function partialOrganization() {
  return prepareProjection({
    ...commonPartialProjection(),
    ...commonOrganization(),
  });
}

export function commonUser() {
  return prepareProjection({
    domain: 1,
    email: 1,
    familyName: 1,
    givenName: 1,
    lastLoggedInAt: 1,
    lastSeenAt: 1,
    loginCount: withDefaultValue('$loginCount', 0),
    slug: 1,
    verified: 1,
  });
}

export function fullUser() {
  return prepareProjection({
    ...commonFullProjection(),
    ...commonUser(),
    '_connection.organization': 1,
  });
}

export function partialUser() {
  return prepareProjection({
    ...commonPartialProjection(),
    ...commonUser(),
  });
}

export function commonWorkspace() {
  return prepareProjection({
    key: 1,
    name: 1,
    slug: 1,
  });
}

export function fullWorkspace() {
  return prepareProjection({
    ...commonFullProjection(),
    ...commonWorkspace(),
    '_edge.application': 1,
    '_edge.organization': 1,
    namespace: 1,
  });
}

export function partialWorkspace() {
  return prepareProjection({
    ...commonPartialProjection(),
    ...commonWorkspace(),
  });
}
