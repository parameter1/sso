import { MongoDBClient } from '@parameter1/mongodb';
import { PropTypes } from '@parameter1/prop-types';

const { object, string } = PropTypes;

export const mongoDBClientProp = object().instance(MongoDBClient).required();
export const entityTypeProp = string().lowercase().pattern(/^[a-z-]+$/);
