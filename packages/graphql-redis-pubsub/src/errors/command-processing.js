export class CommandProcessingError extends Error {
  constructor(message, event) {
    super(message);
    this.name = 'CommandProcessingError';
    this.statusCode = 500;
    this.event = event;
  }
}
