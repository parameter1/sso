import basedb from '@parameter1/base-cms-db';
import { ucFirst } from '@parameter1/utils';
import { AbstractSource } from './-abstract.js';

const { createBaseDB, BaseDB } = basedb;

const knownUserMap = new Map([
  ['jshanks', { givenName: 'Justin', familyName: 'Shanks' }],
  ['tninmann', { givenName: 'Tara', familyName: 'Ninmann' }],
  ['ssimon', { givenName: 'Sam', familyName: 'Simon' }],
  ['kberndtson', { givenName: 'Kim', familyName: 'Berndtson' }],
  ['jdraeger', { givenName: 'Jill', familyName: 'Draeger' }],
  ['chusting', { givenName: 'Curt', familyName: 'Husting' }],
  ['rstrasser', { givenName: 'Ryan', familyName: 'Strasser' }],
  ['rschremp', { givenName: 'Ryan', familyName: 'Schremp' }],
  ['gwartgow', { givenName: 'Greg', familyName: 'Wartgow' }],
  ['ldanes', { givenName: 'Lisa', familyName: 'Danes' }],
  ['sjensen', { givenName: 'Sara', familyName: 'Jensen' }],
  ['dgustavson', { givenName: 'Denise', familyName: 'Gustavson' }],
  ['tudomwongyont', { givenName: 'Beck', familyName: 'Udomwongyont' }],
  ['miendres', { givenName: 'Michelle', familyName: 'Endres' }],
  ['erefermat', { givenName: 'Emily', familyName: 'Refermat' }],
  ['lzimmerman', { givenName: 'Laura', familyName: 'Zimmerman' }],
  ['amalnar', { givenName: 'Andrea', familyName: 'Malnar' }],
  ['mengels', { givenName: 'Monica', familyName: 'Engels' }],
  ['lstewart', { givenName: 'Larry', familyName: 'Stewart' }],
  ['eschulz', { givenName: 'Erica', familyName: 'Schulz' }],
  ['jstarks', { givenName: 'Jonathon', familyName: 'Starks' }],
  ['kjohnston', { givenName: 'Kim', familyName: 'Johnston' }],
  ['nrupprecht', { givenName: 'Nelda', familyName: 'Rupprecht' }],
  ['jminnick', { givenName: 'Jon', familyName: 'Minnick' }],
  ['rdennis', { givenName: 'Rhonda', familyName: 'Dennis' }],
  ['sschreiber', { givenName: 'Sara', familyName: 'Schreiber' }],
  ['jwinters', { givenName: 'Juston', familyName: 'Winters' }],
  ['rlesczynski', { givenName: 'Rachel', familyName: 'Lesczynski' }],
  ['nbecker', { givenName: 'Nikki', familyName: 'Becker' }],
  ['crusch', { givenName: 'Cindy', familyName: 'Rusch' }],
  ['avanetten', { givenName: 'April', familyName: 'VanEtten' }],
  ['astevenson', { givenName: 'Angie', familyName: 'Stevenson' }],
  ['zneiger', { givenName: 'Zach', familyName: 'Neiger' }],
  ['akraemer', { givenName: 'Amy', familyName: 'Kraemer' }],
  ['celmore', { givenName: 'Chad', familyName: 'Elmore' }],
  ['sroberts', { givenName: 'Stacy', familyName: 'Roberts' }],
  ['jwhitty', { givenName: 'Julie', familyName: 'Whitty' }],
  ['bzuehlke', { givenName: 'Barb', familyName: 'Zuehlke' }],
  ['fjandt', { givenName: 'Fred', familyName: 'Jandt' }],
  ['dkolman', { givenName: 'David', familyName: 'Kolman' }],
  ['jkozlowski', { givenName: 'Jonathan', familyName: 'Kozlowski' }],
  ['lhaddican', { givenName: 'Lisa', familyName: 'Haddican' }],
  ['lcleaver', { givenName: 'Lisa', familyName: 'Cleaver' }],
  ['ssteadman', { givenName: 'Sara-Emily', familyName: 'Steadman' }],
  ['mzingsheim', { givenName: 'Missy', familyName: 'Zingsheim' }],
  ['cseeber', { givenName: 'Carmen', familyName: 'Seeber' }],
  ['jhollenhorst', { givenName: 'John', familyName: 'Hollenhorst' }],
  ['eschafer', { givenName: 'Elise', familyName: 'Schafer' }],
  ['bmcallister', { givenName: 'Brad', familyName: 'McAllister' }],
  ['cbennink', { givenName: 'Curt', familyName: 'Bennink' }],
  ['jroembke', { givenName: 'Jackie', familyName: 'Roembke' }],
  ['malley', { givenName: 'Maureen', familyName: 'Alley' }],
  ['esorensen', { givenName: 'Eric', familyName: 'Sorensen' }],
  ['jlescohier', { givenName: 'Jenny', familyName: 'Lescohier' }],
  ['dsingsime', { givenName: 'Denise', familyName: 'Singsime' }],
  ['vroth', { givenName: 'Vicki', familyName: 'Roth' }],
  ['prothman', { givenName: 'Paul', familyName: 'Rothman' }],
  ['asambs', { givenName: 'Arlette', familyName: 'Sambs' }],
  ['bklaas', { givenName: 'Brittney', familyName: 'Klaas' }],
  ['dhamm', { givenName: 'Denise', familyName: 'Hamm' }],
  ['cmoccero', { givenName: 'Casey', familyName: 'Moccero' }],
  ['adederich', { givenName: 'Alex', familyName: 'Dederich' }],
  ['thegg', { givenName: 'Tracy', familyName: 'Hegg' }],
  ['cmantey', { givenName: 'Carrie', familyName: 'Mantey' }],
  ['ekammerzelt', { givenName: 'Eric', familyName: 'Kammerzelt' }],
  ['rhammond', { givenName: 'Rob', familyName: 'Hammond' }],
  ['cbrundige', { givenName: 'Corey', familyName: 'Brundige' }],
  ['mterrazas', { givenName: 'Monique', familyName: 'Terrazas' }],
  ['gudelhofen', { givenName: 'Greg', familyName: 'Udelhofen' }],
  ['akelty', { givenName: 'Angela', familyName: 'Kelty' }],
  ['kabrown', { givenName: 'Kayla', familyName: 'Brown' }],
  ['ckonopacki', { givenName: 'Carrie', familyName: 'Konopacki' }],
  ['rgarrett', { givenName: 'Ronnie', familyName: 'Garrett' }],
  ['khahn', { givenName: 'Kathy', familyName: 'Hahn' }],
  ['lcraft', { givenName: 'Lester', familyName: 'Craft' }],
  ['sshearer', { givenName: 'Scott', familyName: 'Shearer' }],
  ['msabroff', { givenName: 'Mike', familyName: 'Sabroff' }],
  ['rwengel', { givenName: 'Ryan', familyName: 'Wengel' }],
  ['gwhitty', { givenName: 'Gerry', familyName: 'Whitty' }],
  ['rcousin', { givenName: 'Rhonda', familyName: 'Cousin' }],
  ['kponti', { givenName: 'Kirsten', familyName: 'Ponti' }],
  ['kwhite', { givenName: 'Kayla', familyName: 'White' }],
  ['jfranke', { givenName: 'Joel', familyName: 'Franke' }],
  ['yosorio', { givenName: 'Yuli', familyName: 'Osorio' }],
  ['testeditor', { givenName: 'Test', familyName: 'Editor' }],
  ['jheusinkveld', { givenName: 'Jakin', familyName: 'Heusinkveld' }],
  ['bhochfelder', { givenName: 'Barry', familyName: 'Hochfelder' }],
  ['webapps', { givenName: 'Web', familyName: 'Apps' }],
  ['dducharme', { givenName: 'Dana', familyName: 'Ducharme' }],
  ['kbrown', { givenName: 'Kayla', familyName: 'Brown' }],
  ['meauclaire', { givenName: 'Michelle', familyName: 'EauClaire' }],
]);

export class BaseCMSSource extends AbstractSource {
  /**
   *
   * @param {object} params
   * @param {import("@parameter1/base-cms-db").MongoDB} params.mongo
   * @param {string} params.tenant The BaseCMS tenant key, e.g. `acbm_fcp`
   */
  constructor({ mongo, tenant }) {
    if (!/^[a-z0-9]+_[a-z0-9]+$/.test(tenant)) throw new Error(`Invalid BaseCMS tenant key: ${tenant}`);

    super({ kind: 'base-cms', key: tenant });
    this.db = createBaseDB({ tenant, client: mongo });
    this.tenant = tenant;
    this.org = tenant.split('_').shift();
  }

  setMissingEmail(doc) {
    const { org } = this;
    const { username } = doc;
    if (!doc.email || !/@.*\..*/.test(doc.email)) {
      if (/@/.test(username)) return { ...doc, email: username };
      // api.import, api.scheduler, etc. -- create globally
      if (/^api\./.test(username)) {
        const [givenName, familyName] = username.split('.');
        return {
          ...doc,
          email: `user+base_${givenName}_${familyName}@sso.parameter1.com`,
          familyName,
          givenName,
        };
      }
      return { ...doc, email: `user+${org}_${username}@sso.parameter1.com` };
    }
    return doc;
  }

  setMissingNames(doc) { // eslint-disable-line
    if (doc.givenName && doc.familyName) return doc;
    const fallbackMatches = /^user\+.+_(.+)@sso$/.exec(doc.email);
    if (fallbackMatches && fallbackMatches[1]) {
      const username = fallbackMatches[1];
      const known = knownUserMap.has(username);
      if (known) return { ...doc, ...known };
      const givenName = ucFirst(username.slice(0, 1));
      const familyName = ucFirst(username.slice(1));
      return { ...doc, givenName, familyName };
    }
    if (/.+\..+@/.test(doc.email)) {
      const [mailbox] = doc.email.split('@');
      const [givenName, familyName] = mailbox.split('.');
      return {
        ...doc,
        givenName: ucFirst(givenName),
        familyName: ucFirst(familyName),
      };
    }
    const [mailbox, domain] = doc.email.split('@');
    return {
      ...doc,
      givenName: mailbox,
      familyName: `at ${domain}`,
    };
  }

  async loadUsers() {
    const [createdByIds, updatedByIds] = await Promise.all([
      this.db.distinct('platform.Content', 'createdBy'),
      this.db.distinct('platform.Content', 'updatedBy'),
    ]);
    const userIds = [...[...createdByIds, ...updatedByIds].reduce((set, _id) => {
      if (!_id) return set;
      set.add(`${_id}`);
      return set;
    }, new Set())].map((_id) => BaseDB.coerceID(_id));
    const cursor = await this.db.aggregate('platform.User', [
      { $match: { _id: { $in: userIds } } },
      {
        $project: {
          deleted: {
            $or: [
              { $eq: ['$enabled', false] },
              { $eq: ['$accountNonLocked', false] },
            ],
          },
          email: 1,
          familyName: '$lastName',
          givenName: '$firstName',
          username: { $cond: ['$username', { $toLower: '$username' }, '$username'] },
        },
      },
    ]);
    return cursor.map((doc) => {
      const withEmail = this.setMissingEmail(doc);
      const withNames = this.setMissingNames(withEmail);
      return AbstractSource.appendUserDates(withNames);
    }).toArray();
  }
}
