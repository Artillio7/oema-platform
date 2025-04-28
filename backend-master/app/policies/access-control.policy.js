/** Middleware for role-based access control **/
'use strict';

const passport = require('passport');
const httpStatus = require('http-status');

const APIError = require('../helpers/APIError');
const JWT = require('../helpers/jwt.service');

const User = require('../models/user');
const config = require('../../config/config');

/*
 * isAuthorized: check if signed in with Orange Connect or using a JWT token
 */
function isAuthorized(req, res, next) {
  if (!req.session['jwt_token']) {
    if (req.user && req.user.id !== '-1') {
      // User has signed in with Orange Connect.
      // Copy req.user into req.session for email+passwd compatibility.
      req.session.user = req.user;
      return next();
    }

    // Not authenticated with login<email>+password.
    return res.status(401).json({
      success: false,
      message: 'Plase authenticate with your login credentials.',
    });
  }

  // We set the callback to be used in the verify function of the passport-jwt strategy
  // (named as `done` in config/passport.js).
  passport.authenticate('jwt', {session: false}, (error, user) => {
    if (error) {
      const err = new APIError('Passport authentication failed. REST API server error.',
          httpStatus.UNAUTHORIZED, false);
      return next(err);
    }

    if (!user) { // the token expires or not valid
      if (req.session.keepalive) { // refresh the token
        User.findById(req.session.user.id).exec()
            .then(async (user) => {
              if (!user) {
                res.status(401).json({
                  success: false,
                  message: `User ${req.session.user.email} not found.`,
                });
              } else {
                const token = JWT.createTokenFromUserId(user);
                // update req.session.user
                req.session['jwt_token'] = token;
                req.session.user = {
                  id: user.id, email: user.email,
                  firstname: user.firstname, lastname: user.lastname,
                  role: user.role, community: user.community,
                  policy: user.acceptPolicy,
                };

                next();
              }
            })
            .catch((error) => {
            // handle error
              const err = new APIError('Failed to find user in database. REST API server error.',
                  httpStatus.INTERNAL_SERVER_ERROR, true);
              next(err);
            });
      } else if (req.session.user) {
        const user = req.session.user;
        User.findByIdAndUpdate(user.id, {$set: {account: 'inactive'}}).exec()
            .then(async (originalUser) => {
              if (!originalUser) {
                res.status(401).json({success: false, message: `User ${user.email} not found.`});
              } else {
                res.status(401).json({
                  success: false,
                  message: `Invalid token for user ${originalUser.email};${originalUser.firstname || ''}`,
                });
              }
            })
            .catch((error) => {
              const err = new APIError('Failed to update user in database. REST API server error.',
                  httpStatus.INTERNAL_SERVER_ERROR, true);
              next(err);
            });
      }
    } else { // user not null: the JWT token is still valid.
      if (user.account == 'suspended') {
        req.session.destroy((error) => {
          // cannot access session here
          if (error) {
            const err = new APIError('Failed to destroy user session. REST API server error.',
                httpStatus.INTERNAL_SERVER_ERROR, true);
            return next(err);
          }
          // req.logout();
          res.status(401).json({success: false, message: 'Your account has been suspended.'});
        });
      } else {
        // update status of the user (in case disconnected on one device, but not on another device)
        if (user.account == 'inactive' || user.account == 'enabled') {
          User.findByIdAndUpdate(user.id, {$set: {account: 'active'}}).exec()
              .catch((error) => {
                const err = new APIError('Failed to set account as active. REST API server error.',
                    httpStatus.INTERNAL_SERVER_ERROR, true);
                return next(err);
              });
        }

        // Update req.session.user
        req.session.user = {
          id: user.id, email: user.email,
          firstname: user.firstname, lastname: user.lastname,
          role: user.role, community: user.community,
          policy: user.acceptPolicy,
        };

        next();
      }
    }
  })(req, res, next);
}


/** ************************************ RBAC **************************************/
/*
 * RequiresRoles: a role (or several) is required for a request
 * @param requiredRole = 'reviewer', 'referent' or 'admin'
 * @returns {(req, res, next) => {}}
 */
function requiresRoles(...requiredRoles) {
  return (req, res, next) => {
    let authorized = false;
    if (req.session.user) {
      requiredRoles.forEach((role) => {
        if (req.query.group) {
          if ((req.session.user.role[role] & config[req.query.group].communitiesGroupFlag) != 0) {
            authorized = true;
          }
        } else if (req.session.user.role[role] != 0) {
          authorized = true;
        }
      });
    }

    if (authorized) {
      next();
    } else {
      res.status(403).json({success: false, message: 'Forbidden.'});
    }
  };
}

/*
 * RequiresRolesInsideCommunity: a role (or several) is required for a request in the same community
 * @param requiredRole = 'reviewer', 'referent' or 'admin'
 * @returns {(req, res, next) => {}}
 * !!! needs communityId in req.params to get req.community...
 */
function requiresRolesInsideCommunity(...requiredRoles) {
  return (req, res, next) => {
    let authorized = false;

    if (req.session.user) {
      requiredRoles.forEach((role) => {
        if (req.session.user.role[role] != 0) {
          if ((req.community && (req.community.flag & req.session.user.role[role])) ||
            // for Senior Orange Experts; 65280 = 1111111100000000
            (((req.query.type && req.query.type === 'senior') || req.communities) &&
              (config['senior-orange-experts-flag'] & req.session.user.role[role]))) {
            authorized = true;
          }
        }
      });

      if (authorized) {
        next();
      } else {
        res.status(403).json({success: false, message: 'Forbidden.'});
      }
    } else {
      res.status(403).json({success: false, message: 'Forbidden.'});
    }
  };
}


module.exports = {isAuthorized, requiresRoles, requiresRolesInsideCommunity};
