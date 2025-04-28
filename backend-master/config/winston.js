'use strict';

const winston = require('winston');

const config = require('./config');

/*
 * Requiring `winston-mongodb` will expose
 * `winston.transports.MongoDB`
 */
require('winston-mongodb').MongoDB;

// https://github.com/winstonjs/winston/blob/master/docs/transports.md

/*
 * Those Transports are used for production:
 * mongoTransport and errorFileTransport.
 */
const mongoTransport = new winston.transports.MongoDB({
  db: config.mongo.uri,
  collection: 'logs',
  name: 'oemalogs',
  /* capped: true,
  cappedSize: 200000000,*/ /* Size of logs capped collection in bytes*/
  tryReconnect: true,
  expireAfterSeconds: 31536000, // one year
  options: {
    useUnifiedTopology: true,
  },
});

const errorFileTransport = new winston.transports.File({
  filename: './logs/errors.log',
  level: 'error',
  format: winston.format.combine(
      winston.format.colorize(),
      winston.format.json(),
  ),
  maxsize: 100000, // 100 KB
  maxFiles: 5,
  tailable: true,
  zippedArchive: true,
});

const consoleOnlyErrorsTransport = new winston.transports.Console({
  level: 'error',
  format: winston.format.combine(
      winston.format.colorize(),
      winston.format.json(),
  ),
});

/*
 * The console Transport is only for the development environment.
 *
 * mongoexport -u oemadb-user -p ****** -h oswe-mongo:27017 -d oemadb -c logs --out logs.json
 */
const consoleTransport = new winston.transports.Console({
  format: winston.format.combine(
      winston.format.colorize(),
      winston.format.json(),
  ),
});

let transports;

if (process.env.NODE_ENV === 'production') {
  transports = [mongoTransport, errorFileTransport, consoleOnlyErrorsTransport];
} else {
  transports = [consoleTransport, errorFileTransport];
}

const logger = winston.createLogger({
  transports: transports,
});


module.exports = logger;
