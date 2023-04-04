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
      new Organization({
        key: 'acbm',
        name: 'AC Business Media',
        workspaces: [
          new Workspace({
            key: 'construction',
            name: 'Construction',
            sources: [
              new BaseCMSSource({ stack: 'tauron', tenant: 'acbm_fcp' }),
              new EmailXSource({ tenant: 'acbm', publisherIds: ['5c59a275465d19656eab8346'] }),
              new IdentityXSource({ orgId: '5e28a11ef7614f2e698bd70c', appIds: ['5e28a2d858e67b162e55ae3b'] }),
              new NativeXSource({ tenant: 'acbm', publisherIds: ['5aa15386129d890001e79755'] }),
            ],
          }),
          new Workspace({
            key: 'green-industry',
            name: 'Green Industry',
            sources: [
              new BaseCMSSource({ stack: 'tauron', tenant: 'acbm_gip' }),
              new EmailXSource({ tenant: 'acbm', publisherIds: ['5c59a2a4465d19566fab836c'] }),
              new IdentityXSource({ orgId: '5e28a11ef7614f2e698bd70c', appIds: ['5e28a2eb58e67b3a7055ae3c'] }),
              new NativeXSource({ tenant: 'acbm', publisherIds: ['5aa15425129d890001e797f6'] }),
            ],
          }),
          new Workspace({
            key: 'oem',
            name: 'OEM',
            sources: [
              new BaseCMSSource({ stack: 'tauron', tenant: 'acbm_ooh' }),
              new EmailXSource({ tenant: 'acbm', publisherIds: ['5c59a27e465d199419ab8350'] }),
              new IdentityXSource({ orgId: '5e28a11ef7614f2e698bd70c', appIds: ['5e28a32058e67b0e9455ae3e'] }),
              new NativeXSource({ tenant: 'acbm', publisherIds: ['5aa153914795e6000122d7f4'] }),
            ],
          }),
          new Workspace({
            key: 'supply-chain',
            name: 'Supply Chain Network',
            sources: [
              new BaseCMSSource({ stack: 'tauron', tenant: 'acbm_scn' }),
              new EmailXSource({ tenant: 'acbm', publisherIds: ['5c59a2ad465d192d75ab8376', '5c51c1389bcbcf2343dc97e8'] }),
              new IdentityXSource({ orgId: '5e28a11ef7614f2e698bd70c', appIds: ['5e28a2c558e67b89b255ae3a', '5e28a33658e67bda3655ae3f'] }),
              new NativeXSource({ tenant: 'acbm', publisherIds: ['5aa1541b4795e6000122d883', '5aa154344795e6000122d89b'] }),
            ],
          }),
        ],
      }),
    ],
  });
}
