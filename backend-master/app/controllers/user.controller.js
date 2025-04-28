'use strict';

const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const httpStatus = require('http-status');
const APIError = require('../helpers/APIError');

const config = require('../../config/config');
const redisClient = require('../../config/redisConnection').getClient();
const User = require('../models/user');
const Forms = require('../models/form');
const Reviews = require('../models/review');
const Community = require('../models/community');

const uploadCtrl = require('./upload.controller');


/*
 * Load user and append to req.
 */
function loadUser(req, res, next, id) {
  User.get(id)
      .then((user) => {
        req.user = user;
        next();
      })
      .catch((e) => next(e));
}

/*
 * Get the user.
 */
function get(req, res) {
  return res.json(req.user);
}

/*
 * Create a new user
 * @property {string} req.body.email
 * @property {string} req.body.password
 */
function create(req, res, next) {
  const user = new User({
    email: req.body.email, // required
    password: req.body.password, // required
    account: 'inactive',
    role: {
      reviewer: 0,
      referent: 0,
      admin: 0,
    },
  });

  user.save()
      .then((savedUser) => res.json(savedUser))
      .catch((e) => next(e));
}

/*
 * Update existing user by userId
 */
function update(req, res, next) {
  const user = req.user;
  const userEmail = req.user.email;

  if (req.session.user.id == user.id && (!req.query.community || !req.body.role)) {
    // remove fields role, account, community, status, history
    delete req.body.role;
    delete req.body.account;
    delete req.body.community;
    delete req.body.history;
    delete req.body.email;
  }

  Object.assign(user, req.body);

  if (!req.query.community || !req.body.role) {
    user.save()
        .then(async (updatedUser) => {
          if (req.body.email && req.body.email !== userEmail) {
            const uniqueArray = user.history.filter((item, pos, self) =>
              self.findIndex((element) => {
                if (item.formType.endsWith('senior')) {
                  return element.communityId === item.communityId && element.formType.endsWith('senior');
                } else {
                  return element.communityId === item.communityId && !element.formType.endsWith('senior');
                }
              }) === pos);
            try {
              for (const appform of uniqueArray) {
                const community = await Community.findById(appform.communityId, 'label').exec();
                if (appform.formType.endsWith('senior')) {
                  await Forms[`Senior${community.label}`].updateMany({email: userEmail}, {$set: {email: req.body.email}}).exec();
                } else {
                  await Forms[community.label].updateMany({email: userEmail}, {$set: {email: req.body.email}}).exec();
                }
              }
            } catch (e) {
              return next(e);
            }
          }

          res.json(updatedUser);
        })
        .catch((e) => next(e));
  } else {
    if (req.body.role === 'reviewer') { // upgrade the user as reviewer
      if (!req.query.group) {
        const err = new APIError(`The query parameter group is required.`, httpStatus.BAD_REQUEST, true);
        return next(err);
      }

      let filter = {};
      if (req.query.type) {
        filter = {flag: {$bitsAnySet: config[req.query.group].communitiesGroupFlag}};
      } else {
        filter = {name: decodeURIComponent(req.query.community)};
      }

      Community.find(filter).exec()
          .then((communities) => {
            if (!communities.length) {
              const err = new APIError(`No community found!`, httpStatus.BAD_REQUEST, true);
              return next(err);
            }

            user.role = Object.assign(user.role, req.query.type ?
              {reviewer: user.role.reviewer | config['senior-referent-reviewer-role-flag']} :
              {reviewer: user.role.reviewer | communities[0].flag});
            return user.save()
                .then((updatedUser) => [updatedUser, communities]);
          })
          .then(async (result) => {
            const [updatedUser, communities] = result;
            let notifyUser = false;

            if (req.query.type) {
              for (const community of communities) {
                if (community.seniorReviewers.indexOf(updatedUser['_id']) === -1) {
                  community.seniorReviewers.push(updatedUser);
                  await community.save();
                  notifyUser = true;
                }
              }
            } else {
              if (communities[0].reviewers.indexOf(updatedUser['_id']) === -1) {
                communities[0].reviewers.push(updatedUser);
                await communities[0].save();
                notifyUser = true;
              }
            }

            if (notifyUser) {
              // Send notification email to the reviewer !
              let referentMail; let reviewsUrl;

              if (req.query.type) {
                const referent = await User.findOne({'role.referent': {$bitsAllSet: config['senior-orange-experts-flag']}}).exec();
                referentMail = referent?.email ?? config['senior-orange-experts'].adminMail;

                if ([config['senior-orange-experts-flag'], config['senior-referent-reviewer-role-flag']]
                    .includes(updatedUser.role.admin & config['senior-orange-experts-flag']) ||
                  [config['senior-orange-experts-flag'], config['senior-referent-reviewer-role-flag']]
                      .includes(updatedUser.role.referent & config['senior-orange-experts-flag'])) {
                  reviewsUrl = '/dashboard/reviews';
                } else {
                  reviewsUrl = `/dashboard/assigned-reviews/${config['senior-orange-experts-flag']}`;
                }
              } else {
                referentMail = communities[0].referentMail;

                if ((updatedUser.role.admin & communities[0].flag) === communities[0].flag ||
                  (updatedUser.role.referent & communities[0].flag) === communities[0].flag) {
                  reviewsUrl = '/dashboard/reviews';
                } else {
                  reviewsUrl = `/dashboard/assigned-reviews/${communities[0].flag}`;
                }
              }

              let mailFrom = config.mail.from;
              if (req.query.group === 'security-school') {
                mailFrom = config[req.query.group].adminMail;
              }

              const mailOptions = {
                to: updatedUser.email,
                replyTo: referentMail,
                from: mailFrom,
                subject: `${config[req.query.group].reviewerRoleMailTitle} ${req.query.type ? '' : communities[0].name}`,
                text: 'Congrats, you have been designated as a reviewer' +
                  (req.query.type ? ` for the ${config['senior-orange-experts'].name}!\n\n` : ` for the community ${communities[0].name}!\n\n`) +
                  'You can access to the Review section with this URL:\n' +
                  `${config.frontBaseurl}/${req.query.type ? req.query.group.replace('senior-', '') : req.query.group}${reviewsUrl}\n`,
                html: '<p>Congrats, you have been designated as a reviewer' +
                  (req.query.type ? ` for the ${config['senior-orange-experts'].name}!</p>` : ` for the community ${communities[0].name}!</p>`) +
                  '<p>You can access to the Review section with this URL:</p>' +
                  `<p><a href="${config.frontBaseurl}/${req.query.type ? req.query.group.replace('senior-', '') : req.query.group}${reviewsUrl}">`+
                  'Click here to review applications.</a></p>',
              };

              return redisClient.get(config[req.query.group].redis)
                  .then((value) => {
                    let settings;
                    if (value) {
                      settings = {cannotSubmitForms: value};
                    } else {
                      settings = {cannotSubmitForms: 0};
                    }
                    return [updatedUser, communities, mailOptions, settings];
                  });
            } else {
              const err = new APIError('The user ' +
                `${updatedUser.firstname && updatedUser.lastname ? updatedUser.firstname + ' ' + updatedUser.lastname : updatedUser.email}` +
                ' is already a reviewer!', httpStatus.BAD_REQUEST, true);
              throw err;
            }
          })
          .then(async (result) => {
            const [updatedUser, communities, mailOptions, settings] = result;
            // Insert the reviewer into the review table if this one is already created
            const thisYear = settings.cannotSubmitForms ?
                parseInt(settings.cannotSubmitForms) + 1 : (1 + new Date().getFullYear());


            if (req.query.type) {
              for (const community of communities) {
                const reviews = await Reviews[`Senior${community.label}`].find({year: {$eq: thisYear}}).exec();
                if (reviews.length) {
                  for (const review of reviews) {
                    if (review.reviewers.findIndex((r) => r.reviewer.equals(updatedUser.id)) === -1) {
                      review.reviewers.push({
                        reviewer: updatedUser.id,
                        reviews: '',
                        rating: {
                          rate: '',
                        },
                        comments: '',
                      });
                    }
                  }

                  await Reviews[`Senior${community.label}`].create(reviews);
                }
              }
            } else {
              const reviews = await Reviews[communities[0].label].find({year: {$eq: thisYear}}).exec();
              if (reviews.length) {
                for (const review of reviews) {
                  if (review.reviewers.findIndex((r) => r.reviewer.equals(updatedUser.id)) === -1) {
                    review.reviewers.push({
                      reviewer: updatedUser.id,
                      reviews: '',
                      rating: {
                        rate: '',
                      },
                      comments: '',
                    });
                  }
                }

                await Reviews[communities[0].label].create(reviews);
              }
            }

            if (mailOptions) {
              const smtpTransporter = nodemailer.createTransport(config.smtp);
              smtpTransporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                  const err = new APIError('The user has been added successfully as reviewer, but something is wrong, ' +
                    'impossible to send an email to the user to notify reviewer membership.',
                  httpStatus.INTERNAL_SERVER_ERROR, true);
                  return next(err);
                }

                res.json(updatedUser);
              });
            } else {
              res.json(updatedUser);
            }
          })
          .catch((e) => next(e));
    } else if (req.body.role === 'referent') {
      if (req.query.type) {
        user.role = Object.assign(user.role, {referent: user.role.referent | config['senior-orange-experts-flag']});
        user.save()
            .then((updatedUser) => res.json(updatedUser))
            .catch((e) => next(e));
      } else {
        Community.findOne({name: decodeURIComponent(req.query.community)}).exec()
            .then((community) => {
              user.role = Object.assign(user.role, {referent: user.role.referent | community.flag});
              return user.save()
                  .then((updatedUser) => res.json(updatedUser));
            })
            .catch((e) => next(e));
      }
    } else if (req.body.role === 'other-senior-referent') {
      user.role = Object.assign(user.role,
          {referent: (user.role.referent & ~config['senior-orange-experts-flag']) | config['senior-referent-reviewer-role-flag']});
      user.save()
          .then((updatedUser) => res.json(updatedUser))
          .catch((e) => next(e));
    } else if (req.body.role === 'not-referent') {
      if (req.query.type) {
        user.role = Object.assign(user.role, {referent: user.role.referent & ~config['senior-orange-experts-flag']});
        user.save()
            .then((updatedUser) => res.json(updatedUser))
            .catch((e) => next(e));
      } else {
        Community.findOne({name: decodeURIComponent(req.query.community)}).exec()
            .then((community) => {
              user.role = Object.assign(user.role, {referent: user.role.referent & ~community.flag});
              return user.save()
                  .then((updatedUser) => res.json(updatedUser));
            })
            .catch((e) => next(e));
      }
    } else { // downgrade the user from being reviewer
      let filter = {};
      let reviewersField = '';
      if (req.query.type) {
        filter = {flag: {$bitsAnySet: config[req.query.group].communitiesGroupFlag}};
        reviewersField = 'seniorReviewers';
      } else {
        filter = {name: decodeURIComponent(req.query.community)};
        reviewersField = 'reviewers';
      }

      Community.find(filter).populate(reviewersField).exec()
          .then((communities) => {
            if (!communities.length) {
              const err = new APIError(`No community found!`, httpStatus.BAD_REQUEST, true);
              return next(err);
            }

            user.role = Object.assign(user.role, req.query.type ?
            {reviewer: user.role.reviewer & ~config['senior-referent-reviewer-role-flag']} :
              {reviewer: user.role.reviewer & ~communities[0].flag});
            return user.save()
                .then((updatedUser) => [updatedUser, communities]);
          })
          .then(async (result) => {
            const [updatedUser, communities] = result;
            if (req.query.type) {
              for (const community of communities) {
                community.seniorReviewers = community.seniorReviewers.filter((item) => item.email !== updatedUser.email);
                await community.save();
              }
            } else {
              communities[0].reviewers = communities[0].reviewers.filter((item) => item.email !== updatedUser.email);
              await communities[0].save();
            }

            res.json(updatedUser);
          })
          .catch((e) => next(e));
    }
  }
}

/*
 * Get the user list.
 */
function list(req, res, next) {
  User.countDocuments()
      .then((count) => User.list(req.query)
          .then((users) => [count, users]))
      .then((results) => {
        const [count, users] = results;
        res.json({
          recordsTotal: count,
          recordsFiltered: req.query.search ? users.length : count,
          users,
        });
      })
      .catch((e) => next(e));
}

/*
 * Helper for deleting all application forms by a user
 */
function deleteAppFormsByUser(deletedUser) {
  for (const appForm of deletedUser.history) {
    Community.get(appForm.communityId)
        .then((community) => {
          return Forms[appForm.formType.endsWith('senior') ? `Senior${community.label}` : community.label]
              .findByIdAndDelete(appForm.formId)
              .then((deletedForm) => [community, deletedForm]);
        })
        .then((result) => {
          const [community, deletedForm] = result;
          // delete user-uploaded files
          if (deletedForm?.userAnsweredForm) {
            for (const key in deletedForm.userAnsweredForm) {
              if ({}.hasOwnProperty.call(deletedForm.userAnsweredForm, key)) {
                if (key.startsWith('file-')) {
                  uploadCtrl.removeFileFromGridFS((appForm.formType.endsWith('senior') ? 'Senior-' : '') +
                    community.id.toString() + '-' + deletedForm.id.toString() + '-' + deletedForm.userAnsweredForm[key]);
                }
                if (key === 'other-documents-upload' || key.startsWith('dropzone-')) {
                  for (const storedFile of deletedForm.userAnsweredForm[key]) {
                    uploadCtrl.removeFileFromGridFS((appForm.formType.endsWith('senior') ? 'Senior-' : '') +
                      community.id.toString() + '-' + deletedForm.id.toString() + '-' + storedFile.name);
                  }
                }
                if (key.startsWith('aws-file')) {
                  uploadCtrl.removeFileFromS3((appForm.formType.endsWith('senior') ? 'Senior-' : '') +
                    community.id.toString() + '-' + deletedForm.id.toString() + '-' + deletedForm.userAnsweredForm[key]);
                }
              }
            }
          }
        })
        .catch((e) => console.error(e));
  }
}

/*
 * Helper for deleting the user photo
 */
function deleteUserPhoto(deletedUser) {
  uploadCtrl.removeFileFromGridFS(deletedUser.id.toString() + '-profile-photo');
}

/*
 * Delete a user.
 */
function remove(req, res, next) {
  const user = req.user;
  user.deleteOne()
      .then((_) => {
        deleteAppFormsByUser(user);
        deleteUserPhoto(user);
        res.json(user);
      })
      .catch((e) => next(e));
}

function _updateReviewsAfterRemovingReviewers(reviews, ids) {
  for (const review of reviews) {
    // delete items of ids from review.reviewers
    review.reviewers = review.reviewers.filter((item) => !ids.includes(item.reviewer.toString()));

    // update rating for review
    let nbStrAccept = 0; let nbWeaAccept = 0; let nbFair = 0;
    let nbWeaReject = 0; let nbStrReject = 0; let nbReviewers = 0;
    for (const reviewer of review.reviewers) {
      if (reviewer.reviews == 'yes') {
        nbReviewers += 1;
        if (reviewer.rating.rate != '') {
          if (reviewer.rating.rate == '+2') {
            nbStrAccept += 1;
          } else if (reviewer.rating.rate == '+1') {
            nbWeaAccept += 1;
          } else if (reviewer.rating.rate == '0') {
            nbFair += 1;
          } else if (reviewer.rating.rate == '-1') {
            nbWeaReject += 1;
          } else {
            nbStrReject += 1;
          }
        }
      }
    }
    if (nbReviewers) {
      const totalScore = nbStrAccept * 2 + nbWeaAccept - nbWeaReject - nbStrReject * 2;
      const avgScore = totalScore / nbReviewers;
      const stdDevScore = Math.sqrt(
          (nbStrAccept * (2 - avgScore) * (2 - avgScore) +
      nbWeaAccept * (1 - avgScore) * (1 - avgScore) +
      nbFair * avgScore * avgScore +
      nbWeaReject * (1 + avgScore) * (1 + avgScore) +
      nbStrReject * (2 + avgScore) * (2 + avgScore)) / nbReviewers);
      // update review.rate!
      review.rate = {
        'strong-accept': nbStrAccept,
        'weak-accept': nbWeaAccept,
        'fair': nbFair,
        'weak-reject': nbWeaReject,
        'strong-reject': nbStrReject,
        'total-score': totalScore,
        'rate-count': nbReviewers,
        'avg-score': avgScore.toFixed(2),
        'std-dev-score': stdDevScore.toFixed(2),
      };
    } else {
      review.rate = {
        'strong-accept': 0,
        'weak-accept': 0,
        'fair': 0,
        'weak-reject': 0,
        'strong-reject': 0,
        'total-score': 0,
        'rate-count': 0,
        'avg-score': 0.00.toFixed(2),
        'std-dev-score': 0.00.toFixed(2),
      };
    }
  // end of update rating for review
  }
}

/*
 * Update multiple users
 */
function updateUsers(req, res, next) {
  const ids = req.query.ids.split(',');

  if (!req.query.community || !req.body.role) {
    User.updateMany({'_id': {$in: ids.map(function(o) {
      return mongoose.Types.ObjectId.createFromHexString(o);
    })}}, {$set: req.body}).exec()
        .then((raw) => res.json({success: true, message: `Successfully updated the set of users.`}))
        .catch((e) => next(e));
  } else {
    if (req.body.role === 'applicant') { // remove the users from the reviewer membership
      if (!req.query.group) {
        const err = new APIError(`The query parameter group is required.`, httpStatus.BAD_REQUEST, true);
        return next(err);
      }

      let filter = {};
      if (req.query.type) {
        filter = {flag: {$bitsAnySet: config[req.query.group].communitiesGroupFlag}};
      } else {
        filter = {name: decodeURIComponent(req.query.community)};
      }

      Community.find(filter).exec()
          .then((communities) => {
            if (!communities.length) {
              const err = new APIError(`No community found!`, httpStatus.BAD_REQUEST, true);
              return next(err);
            }

            return User.updateMany({
              '_id': {$in: ids.map(function(o) {
                return mongoose.Types.ObjectId.createFromHexString(o);
              })},
              'role.reviewer': req.query.type ?
                {$bitsAllSet: config['senior-referent-reviewer-role-flag']} :
                {$bitsAllSet: communities[0].flag},
            }, {$bit: {'role.reviewer': req.query.type ? {xor: config['senior-referent-reviewer-role-flag']} : {xor: communities[0].flag}}})
                .exec()
                .then((raw) => communities);
          })
          .then(async (communities) => {
            if (req.query.type) {
              for (const community of communities) {
                community.seniorReviewers = community.seniorReviewers.filter((item) => !ids.includes(item.toString()));
                await community.save();
              }
            } else {
              communities[0].reviewers = communities[0].reviewers.filter((item) => !ids.includes(item.toString()));
              await communities[0].save();
            }

            return redisClient.get(config[req.query.group].redis)
                .then((value) => {
                  let settings;
                  if (value) {
                    settings = {cannotSubmitForms: value};
                  } else {
                    settings = {cannotSubmitForms: 0};
                  }
                  return [communities, settings];
                });
          })
          .then(async (results) => {
            // remove the reviewers from the review table if this one is already created
            const [communities, settings] = results;
            const thisYear = settings.cannotSubmitForms != 0 ? parseInt(settings.cannotSubmitForms) + 1 : (1 + new Date().getFullYear());

            if (req.query.type) {
              for (const community of communities) {
                const reviews = await Reviews[`Senior${community.label}`].find({year: {$eq: thisYear}}).exec();
                if (reviews.length) {
                  _updateReviewsAfterRemovingReviewers(reviews, ids);
                  await Reviews[`Senior${community.label}`].create(reviews);
                }
              }
            } else {
              const reviews = await Reviews[communities[0].label].find({year: {$eq: thisYear}}).exec();
              if (reviews.length) {
                _updateReviewsAfterRemovingReviewers(reviews, ids);
                await Reviews[communities[0].label].create(reviews);
              }
            }

            res.json({success: true, message: `Successfully updated the set of users.`});
          })
          .catch((e) => next(e));
    } else if (req.body.role === 'reviewer') {
      let filter = {};
      if (req.query.type) {
        filter = {flag: {$bitsAnySet: config[req.query.group].communitiesGroupFlag}};
      } else {
        filter = {name: decodeURIComponent(req.query.community)};
      }

      Community.findOne(filter).exec()
          .then((communities) => {
            if (!communities.length) {
              const err = new APIError(`No community found!`, httpStatus.BAD_REQUEST, true);
              return next(err);
            }

            return User.updateMany(
                {
                  '_id': {$in: ids.map(function(o) {
                    return mongoose.Types.ObjectId.createFromHexString(o);
                  })},
                  'role.reviewer': req.query.type ? {$bitsAllClear: config['senior-referent-reviewer-role-flag']} : {$bitsAllClear: communities[0].flag},
                },
                {$bit: {'role.reviewer': req.query.type ? {or: config['senior-referent-reviewer-role-flag']} : {or: communities[0].flag}}},
            ).exec()
                .then((raw) => communities);
          })
          .then(async (communities) => {
            if (req.query.type) {
              for (const community of communities) {
                community.seniorReviewers = ids.reduce((coll, item) => {
                  if (coll.indexOf(mongoose.Types.ObjectId.createFromHexString(item)) == -1) {
                    coll.push(mongoose.Types.ObjectId.createFromHexString(item));
                  }
                  return coll;
                }, community.seniorReviewers);

                await community.save();
              }
            } else {
              communities[0].reviewers = ids.reduce((coll, item) => {
                if (coll.indexOf(mongoose.Types.ObjectId.createFromHexString(item)) == -1) {
                  coll.push(mongoose.Types.ObjectId.createFromHexString(item));
                }
                return coll;
              }, communities[0].reviewers);

              await communities[0].save();
            }

            res.json({success: true, message: `Successfully updated the set of users.`});
          })
          .catch((e) => next(e));
    } else if (req.body.role === 'referent') {
      if (req.query.type) {
        User.updateMany(
            {
              '_id': {$in: ids.map(function(o) {
                return mongoose.Types.ObjectId.createFromHexString(o);
              })},
              'role.referent': {$bitsAnyClear: config['senior-orange-experts-flag']},
            },
            {$bit: {'role.referent': {or: config['senior-orange-experts-flag']}}},
        ).exec()
            .then((raw) => res.json({success: true, message: 'Successfully upgraded users as referents for the Senior Expertise community.'}))
            .catch((e) => next(e));
      } else {
        Community.findOne({name: decodeURIComponent(req.query.community)}).exec()
            .then((community) => {
              return User.updateMany(
                  {
                    '_id': {$in: ids.map(function(o) {
                      return mongoose.Types.ObjectId.createFromHexString(o);
                    })},
                    'role.referent': {$bitsAllClear: community.flag},
                  },
                  {$bit: {'role.referent': {or: community.flag}}},
              ).exec()
                  .then((raw) => res.json({success: true, message: `Successfully upgraded users as referents for the community ${community.name}.`}));
            })
            .catch((e) => next(e));
      }
    } else if (req.body.role === 'not-referent') {
      if (req.query.type) {
        User.updateMany({
          '_id': {$in: ids.map(function(o) {
            return mongoose.Types.ObjectId.createFromHexString(o);
          })},
          'role.referent': {$bitsAllSet: config['senior-referent-reviewer-role-flag']},
        }, {$bit: {'role.referent': {and: ~config['senior-orange-experts-flag']}}}).exec()
            .then((raw) => res.json({
              success: true,
              message: 'Successfully downgraded selected user(s) not to be referent(s) for the Senior Expertise community.',
            }))
            .catch((e) => next(e));
      } else {
        Community.findOne({name: decodeURIComponent(req.query.community)}).exec()
            .then((community) => {
              return User.updateMany({'_id': {$in: ids.map(function(o) {
                return mongoose.Types.ObjectId.createFromHexString(o);
              })}, 'role.referent': {$bitsAllSet: community.flag}}, {$bit: {'role.referent': {xor: community.flag}}}).exec()
                  .then((raw) => res.json({
                    success: true,
                    message: `Successfully downgraded selected user(s) not to be referent(s) for the community ${community.name}.`,
                  }));
            })
            .catch((e) => next(e));
      }
    } else {
      const err = new APIError('When using req.query.community, the only values for req.body.role is applicant, reviewer, referent or not-referent.',
          httpStatus.BAD_REQUEST, true);
      next(err);
    }
  }
}

/*
 * Delete multiple users.
 */
function removeUsers(req, res, next) {
  const ids = req.query.ids.split(',');

  User.find({
    '_id': {$in: ids.map(function(o) {
      return mongoose.Types.ObjectId.createFromHexString(o);
    })},
  }).exec()
      .then((deletedUsers) => {
        return User.deleteMany({
          '_id': {$in: ids.map(function(o) {
            return mongoose.Types.ObjectId.createFromHexString(o);
          })},
        }).exec()
            .then((_) => deletedUsers);
      })
      .then((deletedUsers) => {
        // Delete all users' forms
        for (const deletedUser of deletedUsers) {
          deleteAppFormsByUser(deletedUser);
          deleteUserPhoto(deletedUser);
        }

        res.json(deletedUsers);
      })
      .catch((e) => next(e));
}

/*
 * Get the user's application history.
 */
function getUserHistory(req, res, next) {
  const user = req.user;
  return res.json(user.history);
}

/*
 * Create a new application for the user.
 */
function createNewUserApplication(req, res, next) {
  const user = req.user;

  // Check if the user has already submitted a senior application form
  if (req.query.type &&
    user.history.findIndex((appform) => appform.year === 1 + new Date().getFullYear() && appform.formType.endsWith('senior')) !== -1) {
    const err = new APIError('You have already submitted a Senior application for this year!', httpStatus.CONFLICT, true);
    return next(err);
  }

  // create a form document in the collection of req.body.communityId.
  Community.get(req.body.communityId)
      .then((community) => {
        const form = new Forms[req.query.type ? `Senior${community.label}` : community.label]({
          email: user.email,
          formType: req.body.formType,
          formTemplate: req.body.formType === 'new' ?
            (req.query.type ? community.newSeniorForm : community.newForm) :
            (req.query.type ? community.renewalSeniorForm : community.renewalForm),
        });
        return form.save()
            .then((savedForm) => [community, savedForm]);
      })
      .then((result) => {
        const [community, savedForm] = result;
        const newAppForm = {
          status: 'preparing',
          year: 1 + new Date().getFullYear(),
          formId: savedForm.id,
        };
        Object.assign(newAppForm, req.body);
        if (!newAppForm.communityId) {
          newAppForm.communityId = community.id;
        }
        newAppForm.formType = `${req.body.formType}${req.query.type ? '-senior' : ''}`;
        user.history.push(newAppForm);
        return user.save()
            .then((savedUser) => [community, savedForm, savedUser]);
      })
      .then((result) => res.json(result[2].history))
      .catch((e) => next(e));
}

/*
 * Update the last application created by the user with the field communityId = id in req.query.community (= id)
 */
function updateLastUserApplicationWithCommunityId(req, res, next) {
  const user = req.user;
  let appIdx = user.history.length - 1;

  if (req.session.user.id === user.id) {
    // user requesting, so remove confidential field info
    delete req.body.info;
  }

  /* find the application with communityId in the history array **/
  if (req.query.community) {
    const formTypes = [`new${req.query.type ? '-senior' : ''}`, `renew${req.query.type ? '-senior' : ''}`];
    while (appIdx >= 0 &&
      (user.history[appIdx].communityId.toString() !== req.query.community ||
          !formTypes.includes(user.history[appIdx].formType))) {
      appIdx--;
    }
  }

  if (appIdx == -1) {
    const err = new APIError('Community Id not found!', httpStatus.BAD_REQUEST, false);
    return next(err);
  }

  if (req.body.communityId && req.body.formType) {
    // change community here, so delete the form in the previous community
    Community.get(user.history[appIdx].communityId)
        .then((lastCommunity) => {
          return Community.get(req.body.communityId)
              .then((newCommunity) => [lastCommunity, newCommunity]);
        })
        .then((result) => {
          const [lastCommunity, newCommunity] = result;
          const newForm = new Forms[req.query.type ? `Senior${newCommunity.label}` : newCommunity.label]({
            email: user.email,
            formType: req.body.formType,
            formTemplate: req.body.formType === 'new' ?
              (req.query.type ? newCommunity.newSeniorForm : newCommunity.newForm) :
              (req.query.type ? newCommunity.renewalSeniorForm : newCommunity.renewalForm),
          });
          return newForm.save()
              .then((newSavedForm) => [lastCommunity, newCommunity, newSavedForm]);
        })
        .then((result) => {
          const [lastCommunity, newCommunity, newSavedForm] = result;
          return Forms[req.query.type ? `Senior${lastCommunity.label}` : lastCommunity.label]
              .findByIdAndDelete(user.history[appIdx].formId).exec()
              .then(async (deletedForm) => {
                // delete or rename user-uploaded files
                if (deletedForm.userAnsweredForm) {
                  for (const key in deletedForm.userAnsweredForm) {
                    if ({}.hasOwnProperty.call(deletedForm.userAnsweredForm, key)) {
                      if (key.startsWith('file-')) {
                        if (req.query.type) {
                          uploadCtrl.renameFileGridFS((req.query.type ? 'Senior-' : '') +
                            lastCommunity.id.toString() + '-' + deletedForm.id.toString() + '-' + deletedForm.userAnsweredForm[key],
                          (req.query.type ? 'Senior-' : '') +
                            newCommunity.id.toString() + '-' + newSavedForm.id.toString() + '-' + deletedForm.userAnsweredForm[key]);
                        } else {
                          uploadCtrl.removeFileFromGridFS((req.query.type ? 'Senior-' : '') +
                            lastCommunity.id.toString() + '-' + deletedForm.id.toString() + '-' + deletedForm.userAnsweredForm[key]);
                        }
                      }
                      if (key === 'other-documents-upload' || key.startsWith('dropzone-')) {
                        for (const storedFile of deletedForm.userAnsweredForm[key]) {
                          if (req.query.type) {
                            uploadCtrl.renameFileGridFS((req.query.type ? 'Senior-' : '') +
                              lastCommunity.id.toString() + '-' + deletedForm.id.toString() + '-' + storedFile.name,
                            (req.query.type ? 'Senior-' : '') +
                              newCommunity.id.toString() + '-' + newSavedForm.id.toString() + '-' + storedFile.name);
                          } else {
                            uploadCtrl.removeFileFromGridFS((req.query.type ? 'Senior-' : '') +
                              lastCommunity.id.toString() + '-' + deletedForm.id.toString() + '-' + storedFile.name);
                          }
                        }
                      }
                      if (key.startsWith('aws-file')) {
                        if (req.query.type) {
                          uploadCtrl.renameFileS3((req.query.type ? 'Senior-' : '') +
                            lastCommunity.id.toString() + '-' + deletedForm.id.toString() + '-' + deletedForm.userAnsweredForm[key],
                          (req.query.type ? 'Senior-' : '') +
                            newCommunity.id.toString() + '-' + newSavedForm.id.toString() + '-' + deletedForm.userAnsweredForm[key]);
                        } else {
                          uploadCtrl.removeFileFromS3((req.query.type ? 'Senior-' : '') +
                            lastCommunity.id.toString() + '-' + deletedForm.id.toString() + '-' + deletedForm.userAnsweredForm[key]);
                        }
                      }
                    }
                  }
                }
                if (req.query.type) {
                  newSavedForm.formTemplate = deletedForm.formTemplate;
                  newSavedForm.userAnsweredForm = deletedForm.userAnsweredForm;
                  newSavedForm.createdAt = deletedForm.createdAt;
                  await newSavedForm.save();
                }
                return [lastCommunity, newCommunity, newSavedForm, deletedForm];
              });
        })
        .then((result) => {
          const [lastCommunity, newCommunity, newSavedForm, deletedForm] = result;
          user.history[appIdx].formId = newSavedForm.id;
          Object.assign(user.history[appIdx], req.body);
          user.history[appIdx].formType = `${req.body.formType}${req.query.type ? '-senior' : ''}`;
          return user.save()
              .then((updatedUser) => [lastCommunity, newCommunity, newSavedForm, deletedForm, updatedUser]);
        })
        .then((result) => res.json(result[4].history))
        .catch((e) => next(e));
  } else if (!req.body.communityId && req.body.formType) {
    // Change form type inside the same community
    Community.get(user.history[appIdx].communityId)
        .then((community) => {
          return Forms[req.query.type ? `Senior${community.label}` : community.label].get(user.history[appIdx].formId)
              .then((oldForm) => {
                // delete user-uploaded files
                if (oldForm.userAnsweredForm) {
                  for (const key in oldForm.userAnsweredForm) {
                    if ({}.hasOwnProperty.call(oldForm.userAnsweredForm, key)) {
                      if (key.startsWith('file-')) {
                        uploadCtrl.removeFileFromGridFS((req.query.type ? 'Senior-' : '') +
                          community.id.toString() + '-' + oldForm.id.toString() + '-' + oldForm.userAnsweredForm[key]);
                      }
                      if (key === 'other-documents-upload' || key.startsWith('dropzone-')) {
                        for (const storedFile of oldForm.userAnsweredForm[key]) {
                          uploadCtrl.removeFileFromGridFS((req.query.type ? 'Senior-' : '') +
                            community.id.toString() + '-' + oldForm.id.toString() + '-' + storedFile.name);
                        }
                      }
                      if (key.startsWith('aws-file')) {
                        uploadCtrl.removeFileFromS3((req.query.type ? 'Senior-' : '') +
                          community.id.toString() + '-' + oldForm.id.toString() + '-' + oldForm.userAnsweredForm[key]);
                      }
                    }
                  }
                }
                return [community, oldForm];
              });
        })
        .then((result) => {
          const [community, oldForm] = result;
          const newTemplate = req.body.formType === 'new' ?
          (req.query.type ? community.newSeniorForm : community.newForm) :
              (req.query.type ? community.renewalSeniorForm : community.renewalForm);
          oldForm.formTemplate = newTemplate;
          oldForm.formType = req.body.formType;
          oldForm.userAnsweredForm = {};
          oldForm.createdAt = new Date();
          return oldForm.save()
              .then((updatedForm) => [community, oldForm, updatedForm]);
        })
        .then((result) => {
          const [community, oldForm, updatedForm] = result;
          Object.assign(user.history[appIdx], req.body);
          user.history[appIdx].formType = `${req.body.formType}${req.query.type ? '-senior' : ''}`;
          return user.save()
              .then((updatedUser) => [community, oldForm, updatedForm, updatedUser]);
        })
        .then((result) => res.json(result[3].history))
        .catch((e) => next(e));
  } else { // No community, no form type change with the app form update
    if (req.body.status == 'submitted') {
      user.history[appIdx].submittedAt = new Date();
    }

    Object.assign(user.history[appIdx], req.body);

    user.save()
        .then((updatedUser) => res.json(updatedUser.history))
        .catch((e) => next(e));
  }
}

/*
 * Remove the last application created by the user.
 */
function removeLastUserApplication(req, res, next) {
  const user = req.user;
  user.history.splice(-1, 1);
  user.save()
      .then((updatedUser) => res.json(updatedUser.history))
      .catch((e) => next(e));
}


module.exports = {
  loadUser,
  get,
  create,
  update,
  list,
  remove,
  updateUsers,
  removeUsers,
  getUserHistory,
  createNewUserApplication,
  updateLastUserApplicationWithCommunityId,
  removeLastUserApplication,
};
