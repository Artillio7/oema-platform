'use strict';

const {Issuer, Strategy, custom} = require('openid-client');
const {HttpsProxyAgent} = require('https-proxy-agent');
const httpStatus = require('http-status');

const APIError = require('../app/helpers/APIError');

const config = require('./config');
const User = require('../app/models/user');

const orangeConnectIssuerURL = 'https://auth.tech.orange';
// const orangeConnectIssuerURL = 'http://localhost:3000/oidc';

module.exports = (passport) => {
  custom.setHttpOptionsDefaults({
    agent: new HttpsProxyAgent('http://cs.pr-proxy.service.sd.diod.tech:3128'),
  });

  passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });

  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });

  Issuer.discover(orangeConnectIssuerURL)
      .then((oidcIssuer) => {
        const client = new oidcIssuer.Client({
          client_id: config.orangeConnectClientId,
          client_secret: config.orangeConnectClientSecret,
          redirect_uris: process.env.STAGE == 'production' ? ['https://orange-expert-recruitment.apps.fr01.paas.diod.orange.com/api/auth/oidc'] :
          ['https://oswe-frontend-staging.apps.fr01.paas.tech.orange/api/auth/oidc'],
          // redirect_uris: ['https://localhost:4200/api/auth/oidc'],
          response_types: ['code'],

        });

        passport.use(
            'orange_connect',
            new Strategy({client, params: {scope: 'openid profile email'}, passReqToCallback: true},
                (req, tokenSet, done) => {
                  const userinfo = tokenSet.claims();
                  if (!userinfo.email) {
                    done(null, false);
                  } else {
                    const email = userinfo.email.trim().toLowerCase();
                    User.findOne({email}).exec()
                        .then((user) => {
                          if (user) {
                            if (user.account === 'suspended') {
                              // Account suspended
                              const err = new APIError('Your account has been blocked. For more info, contact the admin.',
                                  httpStatus.UNAUTHORIZED, true);
                              throw err;
                            } else {
                              user.account = 'active';
                              user.lastLogin = new Date();
                              return User.updateOne({email}, {$set: {account: user.account, lastLogin: user.lastLogin}}).exec()
                                  .then((_) => user);
                            }
                          } else {
                            // Create a new fake user account
                            return {
                              email,
                              password: '',
                              firstname: userinfo['given_name'],
                              lastname: userinfo['family_name'],
                              account: 'active',
                              acceptPolicy: false,
                              role: {
                                reviewer: 0,
                                referent: 0,
                                admin: 0,
                              },
                            };
                          }
                        })
                        .then((authUser) => {
                          const reqUser = {
                            id: authUser.id || '-1', email: authUser.email,
                            firstname: authUser.firstname, lastname: authUser.lastname,
                            role: authUser.role, community: authUser.community,
                            policy: authUser.acceptPolicy,
                            access_token: tokenSet.access_token,
                          };

                          done(null, reqUser);
                        })
                        .catch((err) => {
                          // handle error
                          done(err);
                        });
                  }
                }),
        );
      });
};
