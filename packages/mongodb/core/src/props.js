import { ClientSession, MongoClient } from 'mongodb';
import { PropTypes } from '@parameter1/sso-prop-types-core';

const { object } = PropTypes;

export const mongoDBClientProp = object().instance(MongoClient).required();
export const mongoSessionProp = object().instance(ClientSession);
