import { OrgManager } from './org-manager.js';
import { Organization } from './organization.js';
import { Workspace } from './workspace.js';

import { BaseCMSSource } from './sources/base-cms.js';
import { EmailXSource } from './sources/email-x.js';
import { IdentityXSource } from './sources/identity-x.js';
import { NativeXSource } from './sources/native-x.js';

export function createOrgManager() {
  return new OrgManager({
    orgs: [
      new Organization({
        key: 'abmedia',
        name: 'AB Media',
        workspaces: [
          new Workspace({
            sources: [
              new BaseCMSSource({ stack: 'virgon', tenant: 'abmedia_all' }),
              new EmailXSource({ tenant: 'abmedia' }),
              new IdentityXSource({ orgId: '5e28a14af7614f59648bd70f' }),
              new NativeXSource({ tenant: 'abmedia' }),
            ],
          }),
        ],
      }),
    ],
  });
}
