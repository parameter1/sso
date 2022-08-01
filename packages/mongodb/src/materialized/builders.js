import { ApplicationBuilder } from './builders/application.js';

export class MaterializedBuilders {
  /**
   *
   */
  constructor() {
    this.classes = new Map();
    this.builders = [
      ApplicationBuilder,
    ].reduce((map, Builder) => {
      const builder = new Builder();
      this.classes.set(builder.entityType, Builder);
      map.set(builder.entityType, builder);
      return map;
    }, new Map());
  }

  /**
   * Gets a builder for the provided entity type.
   *
   * @param {string} entityType
   */
  get(entityType) {
    const builder = this.builders.get(entityType);
    if (!builder) throw new Error(`No builder exists for entity type '${entityType}'`);
    return builder;
  }
}
