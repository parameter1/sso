import { MongoClient } from 'mongodb';
import { PropTypes } from '@parameter1/prop-types';

const { object } = PropTypes;

export const mongoDBClientProp = object().instance(MongoClient).required();
