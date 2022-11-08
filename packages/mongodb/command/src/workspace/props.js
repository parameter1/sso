import { PropTypes } from '@parameter1/sso-prop-types-core';
import { cleanPath } from '@parameter1/utils';
import { getEntityIdPropType } from '@parameter1/sso-prop-types-event';

const { slug, string, url } = PropTypes;

const appUrl = url().external(cleanPath);

export const workspaceProps = {
  id: getEntityIdPropType('workspace'),
  key: slug().pattern(/[a-z]/i).min(2),
  name: string().pattern(/[a-z]/i).min(2),
  url: appUrl,
};
