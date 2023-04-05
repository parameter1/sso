import { OrgManager } from './org-manager.js';
import { Organization } from './organization.js';
import { Workspace } from './workspace.js';

import { BaseCMSSource } from './sources/base-cms.js';
import { EmailXSource } from './sources/email-x.js';
import { LeadManagementSource } from './sources/lead-management.js';
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
      new Organization({
        key: 'allured',
        name: 'Allured Business Media',
        workspaces: [
          new Workspace({
            sources: [
              new BaseCMSSource({ stack: 'tauron', tenant: 'allured_all' }),
              new EmailXSource({ tenant: 'allured' }),
              new IdentityXSource({ orgId: '60774925d562ff340d1329b3' }),
              new NativeXSource({ tenant: 'allured' }),
            ],
          }),
        ],
      }),
      new Organization({
        key: 'ascend',
        name: 'Ascend Media',
        workspaces: [
          new Workspace({
            sources: [
              new BaseCMSSource({ stack: 'tauron', tenant: 'ascend_hh' }),
              new EmailXSource({ tenant: 'ascend' }),
              new NativeXSource({ tenant: 'ascend' }),
            ],
          }),
        ],
      }),
      new Organization({
        key: 'bizbash',
        name: 'BizBash',
        workspaces: [
          new Workspace({
            sources: [
              new BaseCMSSource({ stack: 'tauron', tenant: 'bizbash_bzb' }),
              new EmailXSource({ tenant: 'bizbash' }),
              new IdentityXSource({ orgId: '609d2bf1ac6305ba5790f719' }),
            ],
          }),
        ],
      }),
      new Organization({
        key: 'bobit',
        name: 'Bobit Business Media',
        workspaces: [
          new Workspace({
            key: 'public-safety',
            name: 'Public Safety',
            sources: [
              new BaseCMSSource({ stack: 'virgon', tenant: 'bobit_publicsafety' }),
              new EmailXSource({ tenant: 'bobit' }),
              new IdentityXSource({ orgId: '637c5af4988761a8b41525b2' }),
              new NativeXSource({ tenant: 'bobit' }),
            ],
          }),
        ],
      }),
      new Organization({
        key: 'cma',
        name: 'Cox, Matthews & Associates',
        workspaces: [
          new Workspace({
            sources: [
              new BaseCMSSource({ stack: 'virgon', tenant: 'diverse_all' }),
              new EmailXSource({ tenant: 'diverse' }),
              new IdentityXSource({ orgId: '60b7b2a45ee71a459cb2087a' }),
              new NativeXSource({ tenant: 'diverse' }),
            ],
          }),
        ],
      }),
      new Organization({
        key: 'im',
        name: 'Industrial Media',
        workspaces: [
          new Workspace({
            sources: [
              new BaseCMSSource({ stack: 'tauron', tenant: 'indm_multi' }),
              new EmailXSource({ tenant: 'indm' }),
              new IdentityXSource({ orgId: '5e28a13df7614fdab88bd70d' }),
              new LeadManagementSource({ tenant: 'indm' }),
              new LeadManagementSource({ tenant: 'lynchm' }),
              new NativeXSource({ tenant: 'indm' }),
            ],
          }),
        ],
      }),
      new Organization({
        key: 'in',
        name: 'Investment News',
        workspaces: [
          new Workspace({
            sources: [
              new BaseCMSSource({ stack: 'virgon', tenant: 'bonhill_all' }),
              new EmailXSource({ tenant: 'bonhill' }),
              new IdentityXSource({ orgId: '634cc4adde7099bd5cc8b630' }),
            ],
          }),
        ],
      }),
      new Organization({
        key: 'pmmi',
        name: 'PMMI Media Group',
        workspaces: [
          new Workspace({
            sources: [
              new BaseCMSSource({ stack: 'tauron', tenant: 'pmmi_all' }),
              new EmailXSource({ tenant: 'pmmi', publisherIds: ['609291f8932e210188802d75', '609291efb1fcca1eb21ba585', '609291d5932e21d04d802d62', '600dac837d46a2a37e38dbe7'] }),
              new IdentityXSource({ orgId: '5e28a144f7614f1d488bd70e', appIds: ['5e28a4ba58e67b867055ae4c', '5e28a4ad58e67b166155ae4b', '5e28a4a058e67b7fad55ae4a', '5e28a49458e67b68f255ae49'] }),
              new NativeXSource({ tenant: 'pmmi', publisherIds: ['5da7778e65ebb90001f3cd99', '5da7778465ebb90001f3cd8f', '5da7777265ebb90001f3cd85', '5da7776165ebb90001f3cd7b'] }),
            ],
          }),
          new Workspace({
            key: 'mundo',
            name: 'Mundo',
            sources: [
              new BaseCMSSource({ stack: 'tauron', tenant: 'pmmi_mundo' }),
              new EmailXSource({ tenant: 'pmmi', publisherIds: ['60c2055a4a5b98912ea45c8e'] }),
              new IdentityXSource({ orgId: '5e28a144f7614f1d488bd70e', appIds: ['5e28a4c858e67b86c955ae4d'] }),
              new NativeXSource({ tenant: 'pmmi', publisherIds: ['60832568496c2400016b51c2'] }),
            ],
          }),
        ],
      }),
      new Organization({
        key: 'rmm',
        name: 'Rogue Monky Media',
        workspaces: [
          new Workspace({
            sources: [
              new BaseCMSSource({ stack: 'virgon', tenant: 'roguemonkeymedia_all' }),
              new EmailXSource({ tenant: 'roguemonkeymedia' }),
              new IdentityXSource({ orgId: '6176f25862079415a02d9a44' }),
              new NativeXSource({ tenant: 'roguemonkeymedia' }),
            ],
          }),
        ],
      }),
      new Organization({
        key: 'rr',
        name: 'Randall Reilly',
        workspaces: [
          new Workspace({
            sources: [
              new BaseCMSSource({ stack: 'virgon', tenant: 'randallreilly_all' }),
              new EmailXSource({ tenant: 'randallreilly' }),
              new IdentityXSource({ orgId: '5f77a14c9db2fab680c6317f' }),
              new NativeXSource({ tenant: 'randallreilly' }),
            ],
          }),
        ],
      }),
      new Organization({
        key: 'smg',
        name: 'Science and Medicine Group',
        workspaces: [
          new Workspace({
            sources: [
              new BaseCMSSource({ stack: 'virgon', tenant: 'smg_all' }),
              new EmailXSource({ tenant: 'smg' }),
              new IdentityXSource({ orgId: '627aa459dfa0e102fdc93122' }),
              new NativeXSource({ tenant: 'smg' }),
            ],
          }),
        ],
      }),
    ],
  });
}
