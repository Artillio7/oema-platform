'use strict';

const Joi = require('joi');

/*
 * Require and configure dotenv, will load vars in .env in PROCESS.ENV
 */
require('dotenv').config();


/*
 * Define validation for all the env vars.
 */
const envVarsSchema = Joi.object({
  NODE_ENV: Joi.string()
      .allow('development', 'production', 'test', 'provision')
      .default('development'),
  BASE_URL: Joi.string().uri({
    scheme: [
      'http',
      'https',
    ],
  })
      .default('http://localhost'),
  PORT: Joi.number()
      .default(4040),
  FRONTEND_BASEURL: Joi.string().uri({
    scheme: [
      'http',
      'https',
    ],
  })
      .default('http://127.0.0.1:4200'),
  ORANGE_CONNECT_CLIENT_ID: Joi.string().required()
      .description('Orange Connect Client ID'),
  ORANGE_CONNECT_CLIENT_SECRET: Joi.string().required()
      .description('Orange Connect Client Secret'),
  MONGOOSE_DEBUG: Joi.boolean()
      .when('NODE_ENV', {
        is: Joi.string().equal('development'),
        then: Joi.boolean().default(true),
        otherwise: Joi.boolean().default(false),
      }),
  JWT_SECRET: Joi.string().required()
      .description('JWT Secret required to sign'),
  JWT_ALGORITHM: Joi.string()
      .description('JWT Algorithm')
      .default('HS256'),
  JWT_EXPIRES_IN: Joi.string()
      .description('JWT expires in')
      .default('4h'),
  JWT_ISSUER: Joi.string()
      .description('JWT Issuer')
      .default('Orange'),
  JWT_AUDIENCE: Joi.string()
      .description('JWT Audience')
      .default('Orange Expertise'),
  EXPRESSJS_SESSION_SECRET: Joi.string().required()
      .description('Secret to sign the session ID cookie'),
  MONGO_URI: Joi.string().required()
      .description('Mongo uri'),
  REDIS_HOST: Joi.string().required()
      .description('Redis host'),
  REDIS_PORT: Joi.number()
      .description('Redis port')
      .default(6379),
  REDIS_USER: Joi.string().default('admin')
      .description('User for Redis authentication'),
  REDIS_PASSWORD: Joi.string().required()
      .description('Password for Redis authentication'),
  SMTP_HOST: Joi.string().hostname().required()
      .description('SMTP mail host to send mails'),
  SMTP_PORT: Joi.number()
      .default(465),
  SMTP_SECURE: Joi.boolean()
      .when('SMTP_PORT', {
        is: 465,
        then: Joi.boolean().default(true),
        otherwise: Joi.boolean().default(false),
      }),
  SMTP_AUTH_USER: Joi.string()
      .description('username for SMTP auth')
      .when('SMTP_PORT', {
        is: 465,
        then: Joi.string().required(),
        otherwise: Joi.string(),
      }),
  SMTP_AUTH_PASSWD: Joi.string()
      .description('password for SMTP auth')
      .when('SMTP_PORT', {
        is: 465,
        then: Joi.string().required(),
        otherwise: Joi.string(),
      }),
  SMTP_PROXY: Joi.string().uri(),
  MAIL_FROM: Joi.string().required()
      .description('Sending mails FROM'),
  ADMIN_MAIL: Joi.string().email().required()
      .description('Email of the admin for contact'),
  ORANGE_EXPERTS_ADMIN_MAIL: Joi.string().email().required()
      .description('Email of the admin for Orange Expertise applications'),
  SENIOR_ORANGE_EXPERTS_ADMIN_MAIL: Joi.string().email().required()
      .description('Email of the admin for Orange Senior Experts applications'),
  EXPERTS_DTSI_ADMIN_MAIL: Joi.string().email().required()
      .description('Email of the admin for Experts-DTSI applications'),
  DATA_UP_ADMIN_MAIL: Joi.string().email().required()
      .description('Email of the admin for Security School applications'),
}).unknown()
    .required();

const {error, value: envVars} = envVarsSchema.validate(process.env);
if (error instanceof Joi.ValidationError) {
  throw new Error(`Config validation error: ${error.details[0].message}`);
}

const config = {
  'env': envVars.NODE_ENV,
  'baseURL': envVars.BASE_URL,
  'port': envVars.PORT,
  'frontBaseurl': envVars.FRONTEND_BASEURL,
  'orangeConnectClientId': envVars.ORANGE_CONNECT_CLIENT_ID,
  'orangeConnectClientSecret': envVars.ORANGE_CONNECT_CLIENT_SECRET,
  'mongooseDebug': envVars.MONGOOSE_DEBUG,
  'jwt': {
    secret: envVars.JWT_SECRET,
    algorithm: envVars.JWT_ALGORITHM,
    expiresIn: envVars.JWT_EXPIRES_IN,
    issuer: envVars.JWT_ISSUER,
    audience: envVars.JWT_AUDIENCE,
  },
  'sessionIdSecret': envVars.EXPRESSJS_SESSION_SECRET,
  'mongo': {
    uri: envVars.MONGO_URI,
  },
  'redis': {
    host: envVars.REDIS_HOST,
    port: envVars.REDIS_PORT,
    user: envVars.REDIS_USER,
    pass: envVars.REDIS_PASSWORD,
    // user: envVars.REDIS_CLIENTUSERNAME,
  },
  'smtp': {
    host: envVars.SMTP_HOST,
    port: envVars.SMTP_PORT,
    secure: envVars.SMTP_SECURE,
    tls: {
      rejectUnauthorized: false, // to fix unable to get local issuer certificate with fed-apps.itn.intraorange
      minVersion: 'TLSv1.2',
    },
    // NB: auth and proxy config smtp is set at the end of the file!
  },
  'mail': {
    from: envVars.MAIL_FROM,
    admin: envVars.ADMIN_MAIL,
  },
  's3': {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    bucket: process.env.S3_BUCKET,
    endpoint: process.env.S3_URL,
  },
  'orange-experts': {
    name: 'Orange Expertise Programme',
    communitiesGroupFlag: 65535, /* 11111111 11111111 */
    adminMail: envVars.ORANGE_EXPERTS_ADMIN_MAIL,
    redis: 'cannotSubmitForms-orange-experts',
    activationMailTitle: 'Account activation for the Orange Expertise Programme',
    passwdResetMailTitle: 'Password recovery for your Orange Expertise Programme account',
    accountRecoveryMailTitle: 'Instructions for email address change of your Orange Expertise Programme account',
    submittedAppMailTitle: '[Group Expertise] Submitted application for',
    deletedAppMailTitle: '[Group Expertise] An application has been deleted for',
    reviewerRoleMailTitle: 'Reviewer for the Group Expertise community:',
  },
  'senior-orange-experts-flag': 65280,
  'senior-referent-reviewer-role-flag': 3840,
  'senior-orange-experts': {
    name: 'Senior Expertise Programme',
    communityName: 'Senior Experts',
    communitiesGroupFlag: 65535, /* 11111111 11111111 */
    adminMail: envVars.SENIOR_ORANGE_EXPERTS_ADMIN_MAIL,
    redis: 'cannotSubmitForms-orange-experts',
    activationMailTitle: 'Account activation for the Orange Expertise Programme',
    passwdResetMailTitle: 'Password recovery for your Orange Expertise Programme account',
    accountRecoveryMailTitle: 'Instructions for email address change of your Orange Expertise Programme account',
    submittedAppMailTitle: '[Senior Expertise] Submitted application for',
    deletedAppMailTitle: '[Senior Expertise] An application has been deleted for',
    reviewerRoleMailTitle: 'Reviewer for the Senior Expertise community',
  },
  'experts-dtsi': {
    name: 'Experts-DTSI Programme',
    communitiesGroupFlag: 65536, /* 01 00000000 00000000 */
    adminMail: envVars.EXPERTS_DTSI_ADMIN_MAIL,
    redis: 'cannotSubmitForms-experts-dtsi',
    activationMailTitle: 'Account activation for the Experts-DTSI Programme',
    passwdResetMailTitle: 'Password recovery for your Experts-DTSI Programme account',
    accountRecoveryMailTitle: 'Instructions for email address change of your Experts-DTSI Programme account',
    submittedAppMailTitle: '[Experts-DTSI] Submitted application for',
    deletedAppMailTitle: '[Experts-DTSI] An application form has been deleted for',
    reviewerRoleMailTitle: 'Reviewer for the community:',
  },
  'security-school': {
    name: 'Security School Programme',
    communitiesGroupFlag: 131072,
    adminMail: envVars.DATA_UP_ADMIN_MAIL,
    redis: 'cannotSubmitForms-data-up',
    activationMailTitle: 'Account activation for the Security School Programme',
    passwdResetMailTitle: 'Password recovery for your Security School Programme account',
    accountRecoveryMailTitle: 'Instructions for email address change of your Security School Programme account',
    submittedAppMailTitle: '[Security School] Submitted application for',
    deletedAppMailTitle: '[Security School] An application form has been deleted for',
    reviewerRoleMailTitle: 'Reviewer for the programme:',
  },
};

// Add smtp auth and proxy settings if provided
if (envVars.SMTP_AUTH_USER && envVars.SMTP_AUTH_PASSWD) {
  config.smtp['auth'] = {
    user: envVars.SMTP_AUTH_USER,
    pass: envVars.SMTP_AUTH_PASSWD,
  };
}

if (envVars.SMTP_PROXY) {
  config.smtp['proxy'] = envVars.SMTP_PROXY;
}

module.exports = config;
