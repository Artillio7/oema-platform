'use strict';

const Joi = require('joi');

// require and configure dotenv, will load vars in .env in PROCESS.ENV
require('dotenv').config();


/*
 * Define validation for all the env vars
 */
const envVarsSchema = Joi.object({
  NODE_ENV: Joi.string()
    .allow('development', 'production', 'test', 'provision')
    .default('production'),
  FRONTEND_PORT: Joi.number()
    .description('The port used by the front-end webserver')
    .default(4200),
  REVERSE_PROXY_BACKEND: Joi.string().uri({
      scheme: [
        'http',
        'https'
      ]
    })
    .description(`The reverse proxy for the back-end, must be formatted as 'http://hostname:port'`)
    .default('http://127.0.0.1:4040'),
  FRONTEND_TLS_KEY: Joi.string().required()
    .description('The private key for TLS'),
  FRONTEND_TLS_CERTIFICATE: Joi.string().required()
    .description('The TLS certificate for https')
}).unknown()
.required();

const { error, value: envVars } = envVarsSchema.validate(process.env);
if (error) {
    throw new Error(`Config validation error: ${error.details[0].message}`);
}

const config = {
  env: envVars.NODE_ENV,
  frontend_port: envVars.FRONTEND_PORT,
  reverseProxy: envVars.REVERSE_PROXY_BACKEND,
  tlsKey: envVars.FRONTEND_TLS_KEY,
  tlsCertificate: envVars.FRONTEND_TLS_CERTIFICATE
};


module.exports = config;
