'use strict';

const mongoose = require('mongoose');
const util = require('util');

const config = require('./config/config');
const app = require('./config/express');

const debug = require('debug')('rest-api-jwt-auth:index');


/*
 * Make Bluebird as default promise in mongoose.
 */
mongoose.Promise = require('bluebird');

/*
 * Connect to mongo db
 * https://docs.mongodb.com/manual/reference/connection-string/
 */
mongoose.connect(config.mongo.uri);
mongoose.connection.on('error', () => {
  throw new Error(`Unable to connect to database: ${config.mongo.uri}`);
});

/*
 * Print mongoose logs in dev env.
 */
if (config.MONGOOSE_DEBUG) {
  mongoose.set('debug', (collectionName, method, query, doc) => {
    debug(`${collectionName}.${method}`, util.inspect(query, false, 20), doc);
  });
}

/*
 * ============================
 * ===== Start the server =====
 * ============================
 */
app.listen(config.port, () => {
  console.log(`RESTful API started on port ${config.port} (${config.env})`);
});


module.exports = app;
