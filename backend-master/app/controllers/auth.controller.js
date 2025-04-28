'use strict';

const httpStatus = require('http-status');
const nodemailer = require('nodemailer');
const Promise = require('bluebird');
const bcrypt = Promise.promisifyAll(require('bcrypt'));
const JWT = require('../helpers/jwt.service');
const APIError = require('../helpers/APIError');
const utils = require('../helpers/utils');

const config = require('../../config/config');
const redisClient = require('../../config/redisConnection').getClient();
const User = require('../models/user');
const Community = require('../models/community');
const Forms = require('../models/form');
const Reviews = require('../models/review');


/*
 * Register: sign up a new user.
 */
function register(req, res, next) {
  if (!req.body.email || !req.body.password) {
    res.status(400).json({success: false, message: 'Please enter email and password.'});
  } else {
    const userEmail = req.body.email.trim().toLowerCase();
    /* First check if email already exists */
    User.countDocuments({email: userEmail})
        .then((count) => {
          if (count > 0) {
          // emails exists
            const err = new APIError('An account has already this email.', httpStatus.BAD_REQUEST, true);
            throw err;
          } else {
            return bcrypt.hashAsync(req.body.password, 10)
                .then((hash) => {
                  return hash;
                });
          }
        })
        .then((hash) => {
        /* Put the user credentials into redis temporarily */
        /* only when the user activates his/her account, create a document in mongo for his/her account */
          return redisClient.set('oemaauth:' + userEmail, hash, {EX: 43260}) // key expires after 12h + 60s
              .then((reply) => {
                // create a json web token
                const token = JWT.createTokenFromEmail(userEmail, '12h');
                // send an email for account activation along with the jwt token in the url.
                const smtpTransporter = nodemailer.createTransport(config.smtp);

                let mailFrom = config.mail.from;
                if (req.query.group === 'security-school') {
                  mailFrom = config[req.query.group].adminMail;
                }

                const mailOptions = {
                  to: userEmail,
                  from: mailFrom,
                  subject: config[req.query.group].activationMailTitle,
                  text: `You receive this mail because you (or someone else) have created an account \
on the ${config[req.query.group].name} website.\n\n \
Please click on the following link, or paste it into your browser to complete the process:\n\n \
${config.frontBaseurl}/${req.query.group}/auth/activate/${token}\n\n \
If you did not initiate this request, please ignore this email and we will delete the account.\n`,
                  html: `<p>You receive this mail because you (or someone else) have created an account \
                        on the ${config[req.query.group].name} website.</p>\
                        <p>Please click on the following link to complete the process:</p>\
                        <p><a href="${config.frontBaseurl}/${req.query.group}/auth/activate/${token}">\
                        <b>Click here to activate your account.</b></a></p>\
                        <p>If you did not initiate this request, please ignore this email and we will delete the account.</p>`,
                };

                smtpTransporter.sendMail(mailOptions, (error, info) => {
                  if (error) {
                    const err = new APIError('Cannot send an email to the user for account activation.',
                        httpStatus.INTERNAL_SERVER_ERROR, true);
                    return next(err);
                  }

                  res.json({success: true, message: 'Successfully created new user.'});
                });
              });
        })
        .catch((error) => {
          if (error instanceof APIError) {
            next(error);
          } else {
            const err = new APIError('Signup failed. REST API server error.',
                httpStatus.INTERNAL_SERVER_ERROR, true);
            next(err);
          }
        });
  }
}

/*
 * Login: returns jwt token if valid email and password are provided.
 */
function login(req, res, next) {
  const userEmail = req.body.email.trim().toLowerCase();
  redisClient.get(`oemaauth:${userEmail}`)
      .then((reply) => {
        if (reply) {
          const err = new APIError('We sent you an email just after your registration. ' +
            'Please read it to activate your account.', httpStatus.UNAUTHORIZED, true);
          throw err;
        } else {
          return User.findOne({
            email: userEmail,
          }).exec()
              .then((user) => user);
        }
      })
      .then(async (user) => {
        if (!user) {
        // User ${req.body.email} not found.
          const err = new APIError('User email or password incorrect.', httpStatus.UNAUTHORIZED, true);
          throw err;
        } else {
          if (await user.passwordIsValid(req.body.password)) {
            if (user.account === 'suspended') {
            // Account suspended
              const err = new APIError('Your account has been blocked. For more info, contact the admin.',
                  httpStatus.UNAUTHORIZED, true);
              throw err;
            } else {
              user.account = 'active';
              user.lastLogin = new Date();
              return User.updateOne({email: user.email}, {$set: {account: user.account, lastLogin: user.lastLogin}}).exec()
                  .then((raw) => user);
            }
          } else {
          // Authentication failed. Password did not match.
            const err = new APIError('User email or password incorrect.', httpStatus.UNAUTHORIZED, true);
            throw err;
          }
        }
      })
      .then((savedUser) => {
        // Create the JWT token;
        // expiration timeout given by `config.jwt.expiresIn`
        const token = JWT.createTokenFromUserId(savedUser);

        req.session.keepalive = req.body.keepalive;
        req.session.user = {id: savedUser.id, email: savedUser.email, firstname: savedUser.firstname,
          lastname: savedUser.lastname, role: savedUser.role,
          community: savedUser.community, policy: savedUser.acceptPolicy};
        req.session.group = req.query.group;
        req.session['jwt_token'] = token;

        let userRole;

        if ((savedUser.role.admin & config[req.query.group].communitiesGroupFlag) != 0) {
          userRole = 'Admin';
        } else if ((savedUser.role.referent & config[req.query.group].communitiesGroupFlag) != 0) {
          userRole = 'Referent';
        } else if ((savedUser.role.reviewer & config[req.query.group].communitiesGroupFlag) != 0) {
          userRole = 'Reviewer';
        } else {
          userRole = 'Applicant';
        }


        res.json({
          success: true,
          id: savedUser.id,
          message: `${userRole} ${token}`,
          policy: savedUser.acceptPolicy,
        });
      })
      .catch((error) => {
      // handle error
        if (error instanceof APIError) {
          next(error);
        } else {
          const err = new APIError('Authentication failed. REST API server error.',
              httpStatus.INTERNAL_SERVER_ERROR, true);
          next(err);
        }
      });
}

/*
 * Profile: returns User object for the connected used.
 */
function profile(req, res, next) {
  let availableCommunityFlags;
  if (req.query.group === 'orange-experts' || req.query.group === 'senior-orange-experts') {
    availableCommunityFlags = [1, 2, 4, 8, 16, 32, 64, 128];
  } else if (req.query.group === 'experts-dtsi') {
    availableCommunityFlags = [65536];
  } else { // data-up
    availableCommunityFlags = [131072];
  }

  User.get(req.session.user.id)
      .then((user) => {
        // Update Orange Connect passport session for the user.
        if (req.user) {
          req.session.passport.user.firstname = user.firstname;
          req.session.passport.user.lastname = user.lastname;
          req.session.passport.user.community = user.community;
          req.session.passport.user.role = user.role;
          req.session.passport.user.policy = user.acceptPolicy;
        }

        let userRole;
        let adminFlag = user.role.admin & config[req.query.group].communitiesGroupFlag;
        const referentFlag = user.role.referent & config[req.query.group].communitiesGroupFlag;
        const reviewerFlag = user.role.reviewer & config[req.query.group].communitiesGroupFlag;

        // Set user role and main community
        let communityFlag;
        if (adminFlag) {
          userRole = 'Admin';
          // We limit to one community for admin & referent
          if (utils.bitCount(adminFlag) > 1) {
            if (user.community && availableCommunityFlags.includes(user.community)) {
              adminFlag = adminFlag & user.community;
            } else {
              // only keep first bit set
              adminFlag = availableCommunityFlags.find((flag) => adminFlag & flag);
            }
          }
          communityFlag = adminFlag;
        } else if (referentFlag) {
          userRole = 'Referent';
          if (utils.bitCount(referentFlag) > 1) {
            if (user.community && availableCommunityFlags.includes(user.community)) {
              communityFlag = referentFlag & user.community;
            } else {
              // only keep first bit set
              communityFlag = availableCommunityFlags.find((flag) => referentFlag & flag) ?? 0;
            }
          } else {
            communityFlag = referentFlag;
          }
        } else if (reviewerFlag) {
          userRole = 'Reviewer';
          if (utils.bitCount(reviewerFlag) > 1) {
            if (user.community && availableCommunityFlags.includes(user.community)) {
              communityFlag = (reviewerFlag & user.community) || user.community;
            } else {
              communityFlag = availableCommunityFlags.find((flag) => reviewerFlag & flag) ?? 0;
            }
          } else {
            communityFlag = reviewerFlag;
          }
        } else {
          userRole = 'Applicant';
          communityFlag = (user.community && availableCommunityFlags.includes(user.community)) ? user.community : 0;
        }

        const _user = {
          _id: user._id,
          email: user.email,
          cuid: user.cuid || '',
          role: userRole,
          referent: referentFlag,
          reviewer: {
            flags: reviewerFlag,
            communities: [],
          },
          account: user.account,
          photo: user.photo || '',
          firstname: user.firstname || '',
          lastname: user.lastname || '',
          gender: user.gender || '',
          birthday: user.birthday || '',
          phone: user.phone || '',
          classification: user.classification || '',
          entity: user.entity || '',
          location: user.location || '',
          country: user.country || '',
          managerFirstname: user.managerFirstname || '',
          managerLastname: user.managerLastname || '',
          managerEmail: user.managerEmail || '',
          hrFirstname: user.hrFirstname || '',
          hrLastname: user.hrLastname || '',
          hrEmail: user.hrEmail || '',
          directoryUrl: user.directoryUrl || '',
          history: user.history,
          community: communityFlag,
          communityId: '',
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
        };

        return Community.list()
            .then((communities) => {
              return [_user, communities.filter((c) => c.flag & config[req.query.group].communitiesGroupFlag)];
            });
      })
      .then(async (result) => {
        let [user, communities] = result;
        // Remove app forms not in communities
        user.history = user.history.filter((appform) => communities.find((c) => c._id.toString() === appform.communityId.toString()));

        // Set the main community name
        const userCommunity = communities.find((c) => c.flag & user.community);
        if (!userCommunity) {
          if ((user.referent & config['senior-orange-experts-flag']) || user.reviewer.flags === config['senior-referent-reviewer-role-flag']) {
            user.community = config['senior-orange-experts'].communityName;
            user.communityId = config['senior-orange-experts-flag'];
          } else {
            user.community = 'N/A';
            user.communityId = '';
          }
        } else {
          user.community = userCommunity.name;
          user.communityId = userCommunity._id;
        }

        // Assigned reviews for communities
        // Users (incl. referent and admin!) can be reviewers for several communities
        // so let's find out those communities from reviewerFlag
        if (user.role !== 'Applicant') {
          if (user.role === 'Admin' || user.role === 'Referent') {
            communities = communities.filter((c) => c !== userCommunity);
          }

          const thisYear = 1 + new Date().getFullYear();

          const isSeniorReviewer = (user.reviewer.flags & config['senior-orange-experts-flag']) === config['senior-referent-reviewer-role-flag'];
          let seniorReviewsCount = 0;

          for (const community of communities) {
            if (user.reviewer.flags & community.flag) {
              const count = await Reviews[community.label].countDocuments({
                $and: [
                  {year: {$eq: thisYear}},
                  {reviewers: {$elemMatch: {
                    reviewer: {$eq: req.session.user.id},
                    reviews: {$eq: 'yes'},
                    $or: [{'rating.rate': {$eq: ''}},
                      {comments: {$eq: ''}}],
                  }}},
                ],
              });
              user.reviewer.communities.push({
                id: community._id,
                name: community.name,
                flag: community.flag,
                reviews: count,
                isSenior: 0,
              });
            }

            if (isSeniorReviewer) {
              seniorReviewsCount += await Reviews[`Senior${community.label}`].countDocuments({
                $and: [
                  {year: {$eq: thisYear}},
                  {reviewers: {$elemMatch: {
                    reviewer: {$eq: req.session.user.id},
                    reviews: {$eq: 'yes'},
                    $or: [{'rating.rate': {$eq: ''}},
                      {comments: {$eq: ''}}],
                  }}},
                ],
              });
            }
          }

          if (isSeniorReviewer) {
            user.reviewer.communities.push({
              id: config['senior-orange-experts-flag'],
              name: config['senior-orange-experts'].communityName,
              flag: config['senior-orange-experts-flag'],
              reviews: seniorReviewsCount,
              isSenior: 1,
            });
          }
        }

        res.json(user);
      })
      .catch((e) => next(e));
}

/*
 * Activate the user account
 * (when the user clicks on the URL in the account activation mail received after registration).
 */
function activateAccount(req, res, next) {
  const token = req.params.token;
  JWT.verifyToken(token, (error, decodedToken) => {
    if (error) {
      if (error.name == 'TokenExpiredError') {
        return res.status(401).json({
          success: false, message: `Your link for account activation has expired. \
Register and create your account again.`});
      }
      return res.status(401).json({success: false, message: `Not a valid token: ${error.message}.`});
    }

    redisClient.get('oemaauth:' + decodedToken.email)
        .then((passwdHash) => {
        // create a document for user account
          const newUser = new User({
            email: decodedToken.email,
            password: passwdHash,
            account: 'enabled',
            acceptPolicy: true,
            role: {
              reviewer: 0,
              referent: 0,
              admin: 0,
            },
          });
          return newUser.save()
              .then((user) => {
                // delete user's credentials from redis
                redisClient.del('oemaauth:' + decodedToken.email);

                res.json({success: true, message: `Successfully activated the account of user ${user.email}.`});
              });
        })
        .catch((error) => {
          const err = new APIError('Account activation failed. REST API server error.',
              httpStatus.INTERNAL_SERVER_ERROR, true);
          next(err);
        });
  });
}

/*
 * Log user out.
 */
function logout(req, res, next) {
  const user = req.session.user;

  User.updateOne({email: user.email}, {$set: {account: 'inactive'}}).exec()
      .then((raw) => {
        req.session.destroy((error) => {
        // Cannot access session here
          if (error) {
            const err = new APIError('Failed to destroy user session. REST API server error.',
                httpStatus.INTERNAL_SERVER_ERROR, true);
            throw err;
          }
          res.json({success: true, message: `Successfully logged user ${user.email} out.`});
        });
      })
      .catch((error) => {
        if (error instanceof APIError) {
          next(error);
        } else {
          const err = new APIError('Failed to set account as inactive. REST API server error.',
              httpStatus.INTERNAL_SERVER_ERROR, true);
          next(err);
        }
      });
}

/*
 * Send an email to the user with a link to reset password.
 */
function sendPasswordResetEmail(req, res, next) {
  User.findOne({
    email: req.body.email.trim().toLowerCase(),
  }).exec()
      .then((user) => {
        if (!user) {
          res.status(400).json({success: false, message: `Password recovery: user ${req.body.email} not found.`});
        } else {
        // create a json web token
          const token = JWT.createTokenFromUserId(user, '12h');
          // Send an email for account passwd reset along with the jwt token in the url.
          const smtpTransporter = nodemailer.createTransport(config.smtp);

          let mailFrom = config.mail.from;
          if (req.query.group === 'security-school') {
            mailFrom = config[req.query.group].adminMail;
          }

          const mailOptions = {
            to: user.email,
            from: mailFrom,
            subject: config[req.query.group].passwdResetMailTitle,
            text: `We heard that you lost your password to access to your ${config[req.query.group].name} account. Sorry about that!\n\n \
Don’t worry! You can use the following link to reset your password:\n\n \
${config.frontBaseurl}/${req.query.group}/auth/change-password/${token}\n\n \
The link will expire within 12 hours after reception of this email. If you did not request the password change, please ignore this email.\n`,
            html: `<p>We heard that you lost your password to access to your ${config[req.query.group].name} account. Sorry about that!</p>\
                <p>Don’t worry! You can use the following link to reset your password:</p>\
                <p><a href="${config.frontBaseurl}/${req.query.group}/auth/change-password/${token}">\
                <b>Click here to reset your password.</b></a></p>\
                <p>The link will expire within 12 hours after reception of this email. \
                If you did not request the password change, please ignore this email.</p>`,
          };

          smtpTransporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              const err = new APIError('Cannot send an email to the user for password recovery.',
                  httpStatus.INTERNAL_SERVER_ERROR, true);
              return next(err);
            }

            res.json({success: true, message: 'Successfully sent email for password recovery.'});
          });
        }
      })
      .catch((error) => {
      // handle error
        const err = new APIError('Password recovery failed. REST API server error.',
            httpStatus.INTERNAL_SERVER_ERROR, true);
        next(err);
      });
}

/*
 * Send an email to the user with a link to recover his/her account,
 * i.e. change his/her email address with the one associated with Orange Connect.
 */
function sendAccountRecoveryEmail(req, res, next) {
  User.findOne({
    email: req.body.email.trim().toLowerCase(),
  }).exec()
      .then((user) => {
        if (!user) {
          res.status(400).json({success: false, message: `User ${req.body.email} not found.`});
        } else {
        // Create a json web token encoding the user object
          const token = JWT.createTokenFromUserId(user, '12h');
          // Send an email for account recovery along with the jwt token in the url.
          const smtpTransporter = nodemailer.createTransport(config.smtp);

          let mailFrom = config.mail.from;
          if (req.query.group === 'security-school') {
            mailFrom = config[req.query.group].adminMail;
          }

          const mailOptions = {
            to: user.email,
            from: mailFrom,
            subject: config[req.query.group].accountRecoveryMailTitle,
            text: `A user (${req.body.newEmail}) pretended to be you \
and wanted to modify the email address of your ${config[req.query.group].name} account.\n\n \
If it was you, you can perform the following instructions to change your account with the address ${req.body.newEmail} associated with Orange Connect.\n\n \
First, you need to sign in with Orange Connect on OEMA:\n\n \
${config.frontBaseurl}/${req.query.group}/auth/login\n\n \
Then use this URL to modify your account email address:\n\n \
${config.frontBaseurl}/${req.query.group}/auth/change-email/${token}\n\n \
The link will expire within 12 hours after reception of this email. If you did not request the email address change, please ignore this email and inform us.\n`,
            html: `<p>A user (${req.body.newEmail}) pretended to be you \
                and wanted to modify the email address of your ${config[req.query.group].name} account</p>\
                <p>If it was you, you can perform the following instructions \
                to change your account with the address ${req.body.newEmail} associated with Orange Connect.</p>\
                <p>First, you need to sign in with Orange Connect on OEMA:</p>\
                <p><a href="${config.frontBaseurl}/${req.query.group}/auth/login"><b>OEMA sign in with Orange Connect</b></a></p>\
                <p>Then, use the following URL modify your account email address.</p>\
                <p><a href="${config.frontBaseurl}/${req.query.group}/auth/change-email/${token}">\
                <b>Click here to change your account email address.</b></a></p>\
                <p>The link will expire within 12 hours after reception of this email. \
                If you did not request the email address change, please ignore this email and inform us.</p>`,
          };

          smtpTransporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              const err = new APIError('Cannot send an email to the user for account recovery.',
                  httpStatus.INTERNAL_SERVER_ERROR, true);
              return next(err);
            }

            res.json({success: true, message: 'Successfully sent email for account recovery.'});
          });
        }
      })
      .catch((error) => {
      // handle error
        const err = new APIError('Password recovery failed. REST API server error.',
            httpStatus.INTERNAL_SERVER_ERROR, true);
        next(err);
      });
}

/*
 * Set a new password for the user authenticated with the JWT token.
 */
function resetPassword(req, res, next) {
  const token = req.params.token;
  JWT.verifyToken(token, (error, decodedToken) => {
    if (error) {
      if (error.name == 'TokenExpiredError') {
        return res.status(401).json({success: false, message: `Your link for resetting your password has expired.`});
      }
      return res.status(401).json({success: false, message: `Not a valid token: ${error.message}.`});
    }

    // Set account to 'inactive'
    // (when the user will log in later, set its status to 'active').
    const userId = decodedToken.id;
    User.updateOne({_id: userId}, {$set: {password: req.body.password, account: 'inactive'}}).exec()
        .then((raw) => res.json({success: true, message: 'Successfully changed password.'}))
        .catch((error) => {
          const err = new APIError('Password change failed. REST API server error.',
              httpStatus.INTERNAL_SERVER_ERROR, true);
          next(err);
        });
  });
}

/*
 * Change user account email after signing in with Orange Connect.
 */
function changeOidcAccountEmail(req, res, next) {
  if (!req.user?.email) {
    // Not signed in with Orange Connect.
    return res.status(401).json({success: false, message: 'Unauthorized'});
  }

  const token = req.params.token;

  JWT.verifyToken(token, (error, decodedToken) => {
    if (error) {
      if (error.name == 'TokenExpiredError') {
        return res.status(401).json({success: false, message: `Your link for changing your account email has expired.`});
      }
      return res.status(401).json({success: false, message: `Not a valid token: ${error.message}.`});
    }

    const userId = decodedToken.id;

    User.findOneAndUpdate({_id: userId}, {$set: {email: req.user.email, account: 'active'}}).exec()
        .then(async (originalUser) => {
          const uniqueArray = originalUser.history.filter((item, pos, self) =>
            self.findIndex((element) => {
              if (item.formType.endsWith('senior')) {
                return element.communityId === item.communityId && element.formType.endsWith('senior');
              } else {
                return element.communityId === item.communityId && !element.formType.endsWith('senior');
              }
            }) === pos);
          for (const appform of uniqueArray) {
            const community = await Community.findById(appform.communityId, 'label').exec();
            if (appform.formType.endsWith('senior')) {
              await Forms[`Senior${community.label}`].updateMany({email: originalUser.email}, {$set: {email: req.user.email}}).exec();
            } else {
              await Forms[community.label].updateMany({email: originalUser.email}, {$set: {email: req.user.email}}).exec();
            }
          }

          // Update user passport session for Orange Connect
          req.session.passport.user.id = originalUser.id;
          req.session.passport.user.firstname = originalUser.firstname;
          req.session.passport.user.lastname = originalUser.lastname;
          req.session.passport.user.role = originalUser.role;
          req.session.passport.user.community = originalUser.community;
          req.session.passport.user.policy = originalUser.acceptPolicy;

          let userRole = 'Applicant';
          if (originalUser.role) {
            if ((originalUser.role.admin & config[req.session.group].communitiesGroupFlag) != 0) {
              userRole = 'Admin';
            } else if ((originalUser.role.referent & config[req.session.group].communitiesGroupFlag) != 0) {
              userRole = 'Referent';
            } else if ((originalUser.role.reviewer & config[req.session.group].communitiesGroupFlag) != 0) {
              userRole = 'Reviewer';
            } else {
              userRole = 'Applicant';
            }
          }

          res.json({
            success: true,
            id: originalUser.id,
            message: `${userRole} ${req.user.access_token} ${req.user.email} ${req.user.firstname || ''}`,
            policy: originalUser.acceptPolicy,
          });
        })
        .catch((error) => {
          const err = new APIError('Account email change failed. REST API server error.',
              httpStatus.INTERNAL_SERVER_ERROR, true);
          next(err);
        });
  });
}

/*
 * Check whether the application submission is closed.
 */
function canSubmitForms(req, res, next) {
  redisClient.get(config[req.query.group].redis)
      .then((value) => {
        if (value) {
          if (req.query.user) {
            return redisClient.get(
                `${config[req.query.group].redis}-${req.query.user == '1' ? req.session.user.id : req.query.user}`)
                .then((val) => {
                  if (val) {
                    res.json({success: true, state: 0, message: 'OK'});
                  } else {
                    res.json({success: true, state: 0, message: 'KO'});
                  }
                });
          } else {
            res.json({success: true, state: 0, message: 'KO'});
          }
        } else {
          res.json({success: true, state: 1, message: 'OK'});
        }
      })
      .catch((error) => {
        const err = new APIError('Redis server error: cannot get the value for canSubmitForms.', httpStatus.INTERNAL_SERVER_ERROR, true);
        next(err);
      });
}

/*
 * Open or close the application submission
 * either globally for everyone,
 * or only for one user.
 */
function openCloseSubmission(req, res, next) {
  if (req.body.state == 0) {
    redisClient.set(`${config[req.query.group].redis}${req.query.user ? '-' + req.query.user : ''}`,
        new Date().getFullYear(), {EX: req.query.user ? 1209600 : 31536000}) // key expires 14 days or after 1 year
        .then((_) => {
          if (req.query.user) {
            return User.findOne({'_id': req.query.user}).exec()
                .then((user) => user);
          } else {
            return null;
          }
        })
        .then((user) =>
          res.json({
            success: true,
            state: 0,
            message: `App form submission ${req.query.user ? 'open for the user' + (req.query.usermail ? ' ' + req.query.usermail : '') : 'closed'}!`,
            user: user,
          }),
        )
        .catch((e) => next(e));
  } else {
    redisClient.del(`${config[req.query.group].redis}${req.query.user ? '-' + req.query.user : ''}`)
        .then((_) =>
          res.json({
            success: true,
            state: req.query.user ? 0 : 1,
            message: `App form submission ${req.query.user ? 'closed for the user' + (req.query.usermail ? ' ' + req.query.usermail : '') : 'open'}!`,
          }),
        )
        .catch((e) => next(e));
  }
}

/*
 * Get the list of the users who benefit from
 * an additional delay to submit their application.
 */
async function listLatecomers(req, res, next) {
  const keys = [];

  for await (const key of redisClient.scanIterator({
    TYPE: 'string', // `SCAN` only
    MATCH: `${config[req.query.group].redis}-*`,
    COUNT: 100,
  })) {
    keys.push(key);
  }

  // Scan Complete
  return User.find({'_id': {$in: keys.map((id) => id.replace(`${config[req.query.group].redis}-`, ''))}}).exec()
      .then((users) => res.json(users));
}

/*
 * Remove the additional access delay for one or several latecomers.
 */
function removeLatecomers(req, res, next) {
  const ids = req.query.ids.split(',').map((id) => `${config[req.query.group].redis}-${id}`);
  redisClient.del(ids)
      .then((_) =>
        res.json({success: true, message: 'Successfully deleted the set of latecomers.'}),
      )
      .catch((e) => next(e));
}


module.exports = {
  login,
  register,
  profile,
  activateAccount,
  logout,
  sendPasswordResetEmail,
  sendAccountRecoveryEmail,
  resetPassword,
  changeOidcAccountEmail,
  canSubmitForms,
  openCloseSubmission,
  listLatecomers,
  removeLatecomers,
};
