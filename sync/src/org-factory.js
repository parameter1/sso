import { OrgManager } from './org-manager.js';
import { Organization } from './organization.js';
import { Workspace } from './workspace.js';

import { BaseCMSSource } from './sources/base-cms.js';
import { EmailXSource } from './sources/email-x.js';
import { LeadManagementSource } from './sources/lead-management.js';
import { IdentityXSource } from './sources/identity-x.js';
import { NativeXSource } from './sources/native-x.js';

import { aquaria, tauron, virgon } from './mongodb.js';

export function createOrgManager() {
  return new OrgManager({
    orgs: [
      new Organization({
        key: 'abmedia',
        name: 'AB Media',
        website: 'http://www.abmedia.biz/',
        workspaces: [
          new Workspace({
            sources: [
              new BaseCMSSource({ mongo: virgon, tenant: 'abmedia_all' }),
              new EmailXSource({ mongo: aquaria, tenant: 'abmedia' }),
              new IdentityXSource({ mongo: aquaria, orgId: '5e28a14af7614f59648bd70f' }),
              new NativeXSource({ mongo: aquaria, tenant: 'abmedia' }),
            ],
          }),
        ],
      }),
      new Organization({
        key: 'acbm',
        name: 'AC Business Media',
        workspaces: [
          new Workspace({
            sources: [
              new BaseCMSSource({ mongo: tauron, tenant: 'acbm_fcp' }),
              new BaseCMSSource({ mongo: tauron, tenant: 'acbm_gip' }),
              new BaseCMSSource({ mongo: tauron, tenant: 'acbm_ooh' }),
              new BaseCMSSource({ mongo: tauron, tenant: 'acbm_scn' }),
              new EmailXSource({ mongo: aquaria, tenant: 'acbm' }),
              new IdentityXSource({ mongo: aquaria, orgId: '5e28a11ef7614f2e698bd70c' }),
              new NativeXSource({ mongo: aquaria, tenant: 'acbm' }),
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
              new BaseCMSSource({ mongo: tauron, tenant: 'allured_all' }),
              new EmailXSource({ mongo: aquaria, tenant: 'allured' }),
              new IdentityXSource({ mongo: aquaria, orgId: '60774925d562ff340d1329b3' }),
              new NativeXSource({ mongo: aquaria, tenant: 'allured' }),
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
              new BaseCMSSource({ mongo: tauron, tenant: 'ascend_hh' }),
              new EmailXSource({ mongo: aquaria, tenant: 'ascend' }),
              new NativeXSource({ mongo: aquaria, tenant: 'ascend' }),
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
              new BaseCMSSource({ mongo: tauron, tenant: 'bizbash_bzb' }),
              new EmailXSource({ mongo: aquaria, tenant: 'bizbash' }),
              new IdentityXSource({ mongo: aquaria, orgId: '609d2bf1ac6305ba5790f719' }),
              new NativeXSource({ mongo: aquaria, tenant: 'bbm' }),
            ],
          }),
        ],
      }),
      new Organization({
        key: 'bobit',
        name: 'Bobit Business Media',
        workspaces: [
          new Workspace({
            sources: [
              new BaseCMSSource({ mongo: virgon, tenant: 'bobit_publicsafety' }),
              new EmailXSource({ mongo: aquaria, tenant: 'bobit' }),
              new IdentityXSource({ mongo: aquaria, orgId: '637c5af4988761a8b41525b2' }),
              new NativeXSource({ mongo: aquaria, tenant: 'bobit' }),
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
              new BaseCMSSource({ mongo: virgon, tenant: 'diverse_all' }),
              new EmailXSource({ mongo: aquaria, tenant: 'diverse' }),
              new IdentityXSource({ mongo: aquaria, orgId: '60b7b2a45ee71a459cb2087a' }),
              new NativeXSource({ mongo: aquaria, tenant: 'diverse' }),
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
              new BaseCMSSource({ mongo: tauron, tenant: 'indm_multi' }),
              new EmailXSource({ mongo: aquaria, tenant: 'indm' }),
              new IdentityXSource({ mongo: aquaria, orgId: '5e28a13df7614fdab88bd70d' }),
              new LeadManagementSource({ mongo: aquaria, tenant: 'indm' }),
              new LeadManagementSource({ mongo: aquaria, tenant: 'lynchm' }),
              new NativeXSource({ mongo: aquaria, tenant: 'indm' }),
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
              new BaseCMSSource({ mongo: tauron, tenant: 'pmmi_all' }),
              new BaseCMSSource({ mongo: tauron, tenant: 'pmmi_mundo' }),
              new EmailXSource({ mongo: aquaria, tenant: 'pmmi' }),
              new IdentityXSource({ mongo: aquaria, orgId: '5e28a144f7614f1d488bd70e' }),
              new NativeXSource({ mongo: aquaria, tenant: 'pmmi' }),
            ],
          }),
        ],
      }),
      new Organization({
        key: 'rmm',
        name: 'Rogue Monkey Media',
        workspaces: [
          new Workspace({
            sources: [
              new BaseCMSSource({ mongo: virgon, tenant: 'roguemonkeymedia_all' }),
              new EmailXSource({ mongo: aquaria, tenant: 'roguemonkeymedia' }),
              new IdentityXSource({ mongo: aquaria, orgId: '6176f25862079415a02d9a44' }),
              new NativeXSource({ mongo: aquaria, tenant: 'roguemonkeymedia' }),
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
              new BaseCMSSource({ mongo: virgon, tenant: 'randallreilly_all' }),
              new EmailXSource({ mongo: aquaria, tenant: 'randallreilly' }),
              new IdentityXSource({ mongo: aquaria, orgId: '5f77a14c9db2fab680c6317f' }),
              new NativeXSource({ mongo: aquaria, tenant: 'randallreilly' }),
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
              new BaseCMSSource({ mongo: virgon, tenant: 'smg_all' }),
              new EmailXSource({ mongo: aquaria, tenant: 'smg' }),
              new IdentityXSource({ mongo: aquaria, orgId: '627aa459dfa0e102fdc93122' }),
              new NativeXSource({ mongo: aquaria, tenant: 'smg' }),
            ],
          }),
        ],
      }),
      new Organization({
        key: 'watt',
        name: 'Watt Global Media',
        workspaces: [
          new Workspace({
            sources: [
              new BaseCMSSource({ mongo: virgon, tenant: 'wattglobalmedia_all' }),
              new EmailXSource({ mongo: aquaria, tenant: 'watt' }),
              new IdentityXSource({ mongo: aquaria, orgId: '63e974eb0d243edfbe501e80' }),
              new NativeXSource({ mongo: aquaria, tenant: 'watt' }),
            ],
          }),
        ],
      }),
    ],
  });
}
