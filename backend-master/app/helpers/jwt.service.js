'use strict';

const jwt = require('jsonwebtoken');

const config = require('../../config/config');


/*
 * Create a JWT token for user, with optional expiration time
 */
function createTokenFromUserId(user, tokenExpiresIn) {
  return jwt.sign({
    id: user.id,
  }, config.jwt.secret, {
    algorithm: config.jwt.algorithm,
    expiresIn: tokenExpiresIn || config.jwt.expiresIn,
    issuer: config.jwt.issuer,
    audience: config.jwt.audience,
  });
}
function createTokenFromEmail(email, tokenExpiresIn) {
  return jwt.sign({
    email: email,
  }, config.jwt.secret, {
    algorithm: config.jwt.algorithm,
    expiresIn: tokenExpiresIn || config.jwt.expiresIn,
    issuer: config.jwt.issuer,
    audience: config.jwt.audience,
  });
}
/*
 * Validate a JWT token
 */
function verifyToken(token, callback) {
  return jwt.verify(token, config.jwt.secret, {}, callback);
}


module.exports = {createTokenFromUserId, createTokenFromEmail, verifyToken};
