import {
  cleanEnv,
  port,
  str,
} from 'envalid';

export const {
  APP_URL,
  EMAIL_FROM,
  EMAIL_REPLY_TO,
  EXPOSED_HOST,
  EXPOSED_PORT,
  HOST,
  MONGO_DB_NAME,
  MONGO_URL,
  PORT,
  SENDGRID_API_KEY,
  TOKEN_SECRET,
} = cleanEnv(process.env, {
  APP_URL: str({ desc: 'The single sign-on application/interace URL.' }),
  EMAIL_FROM: str({ desc: 'The address to use when sending email.', default: 'Parameter1 SSO <no-reply@sso.parameter1.com>' }),
  EMAIL_REPLY_TO: str({ desc: 'The reply-to email address when sending email', default: 'support@parameter1.com' }),
  EXPOSED_HOST: str({ desc: 'The host that the service is exposed on.', default: '0.0.0.0' }),
  EXPOSED_PORT: port({ desc: 'The port that the service is exposed on.', default: 80 }),
  HOST: str({ desc: 'The host that the service will run on.', default: '0.0.0.0' }),
  MONGO_DB_NAME: str({ desc: 'The MongoDB database name to use.', default: 'sso@management' }),
  MONGO_URL: str({ desc: 'The MongoDB URL to connect to.' }),
  PORT: port({ desc: 'The port that the service will run on.', default: 80 }),
  SENDGRID_API_KEY: str({ desc: 'The Sendgrid API key.' }),
  TOKEN_SECRET: str({ desc: 'The secret to use when signing tokens.' }),
});
