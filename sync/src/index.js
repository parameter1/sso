import { inspect } from 'util';
import { createOrgManager } from './org-factory.js';

const orgManager = createOrgManager();
console.log(inspect(orgManager, { colors: true, depth: null }));
