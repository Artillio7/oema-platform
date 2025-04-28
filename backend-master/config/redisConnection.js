'use strict';

const redis = require('redis');

const config = require('./config');


let client = null;

/*
 * In redis client V4, the client does not automatically connect to the server.
 * Instead you need to run .connect()
 */
module.exports.getClient = function(db = 1) {
  if (db !== 1) {
    const sessionStore = redis.createClient({
      socket: {
        host: config.redis.host,
        port: config.redis.port,
      },
      username: config.redis.user,
      password: config.redis.pass,
      database: db,
    });

    (async () => await sessionStore.connect())();

    return sessionStore;
  }

  if (!client) {
    client = redis.createClient({
      socket: {
        host: config.redis.host,
        port: config.redis.port,
      },
      username: config.redis.user,
      password: config.redis.pass,
      database: 1,
    });

    (async () => await client.connect())();

    client.on('error', (err) => console.log('Redis client: ' + err));
  }

  return client;
};
