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
      if (v === 1) value = withDefaultValue(`$${key}`);
      if (typeof v === 'string') value = withDefaultValue(value);
      return { ...o, [key]: value };
    }, { ...defaults });
}

export function projectAsNode(projection) {
  const node = prepareProjection(projection, { _id: '$_id' });
  return { _id: 0, node };
}

export function metaProjection() {
  return prepareProjection({
    _meta: {
      created: '$__.created',
      modified: '$__.modified',
      touched: '$__.touched',
    },
  });
}

function commonFullProjection() {
  return prepareProjection({
    _deleted: '$__.isDeleted',
    _history: asArray('$__.history'),
    ...metaProjection(),
  });
}

function commonPartialProjection() {
  return prepareProjection({
    ...metaProjection(),
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
    managerConnection: 1,
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
    organizationConnection: 1,
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
  });
}

export function partialWorkspace() {
  return prepareProjection({
    ...commonPartialProjection(),
    ...commonWorkspace(),
  });
}
