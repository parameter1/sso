export class UserNormalizationBuilder {
  static get() {
    return {
      valueBranches: [{
        case: { $eq: ['$$this.command', 'MAGIC_LOGIN'] },
        then: {
          lastLoggedInAt: '$$this.date',
          loginCount: { $add: [{ $ifNull: ['$$value.values.loginCount', 0] }, 1] },
          verified: true,
        },
      }],
      mergeValuesStages: [{
        previousEmails: {
          $setUnion: [
            { $cond: [{ $isArray: '$$value.values.previousEmails' }, '$$value.values.previousEmails', []] },
            { $cond: ['$$this.values.email', ['$$this.values.email'], []] },
          ],
        },
      }],
      newRootMergeObjects: [{
        previousEmails: {
          $filter: { input: '$_.values.previousEmails', cond: { $ne: ['$$this', '$_.values.email'] } },
        },
      }],
    };
  }
}
