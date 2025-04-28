'use strict';

const JwtStrategy = require('passport-jwt').Strategy;
// const ExtractJwt = require('passport-jwt').ExtractJwt;


/*
 * Load up the user model
 */
const User = require('../app/models/user');
const config = require('./config');

const jwtExtractFromSession = function(req) {
  let token = null;
  if (req && req.session) {
    token = req.session['jwt_token'];
  }
  return token;
};


module.exports = function(passport) {
  const opts = {};
  opts.jwtFromRequest = jwtExtractFromSession;
  opts.secretOrKey = config.jwt.secret;
  opts.issuer = config.jwt.issuer;
  opts.audience = config.jwt.audience;
  passport.use(new JwtStrategy(opts, (jwtPayload, done) => {
    // Find the user to which that the jwt belongs.
    User.findOne({_id: jwtPayload.id}).exec()
        .then((user) => {
          if (user) {
            done(null, user);
          } else {
            done(null, false);
          }
        })
        .catch((err) => {
        // handle error
          done(err);
        });
  }));
};
