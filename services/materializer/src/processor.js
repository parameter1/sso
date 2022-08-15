import { jsonClient } from '@parameter1/micro';
import { COMMAND_PROCESSOR_URL } from './env.js';

export default jsonClient({
  url: COMMAND_PROCESSOR_URL,
});
