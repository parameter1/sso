export class CommandProcessingTimeoutError extends Error {
  constructor(message, results) {
    super(message);
    this.name = 'CommandProcessingTimeoutError';
    this.statusCode = 408;
    this.events = results.map(({ _id, entityType }) => ({ _id, entityType }));
  }
}
