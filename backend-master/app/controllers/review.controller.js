'use strict';

const mongoose = require('mongoose');
const httpStatus = require('http-status');
const Promise = require('bluebird');
const APIError = require('../helpers/APIError');

const config = require('../../config/config');
const redisClient = require('../../config/redisConnection').getClient();
const User = require('../models/user');
const Forms = require('../models/form');
const Reviews = require('../models/review');
const Community = require('../models/community');


/*
 * Order reviewers by lastname,
 * irrespective of how they write their lastname
 * in lowercase or uppercase.
 */
function orderReviewers(a, b) {
  const nameA = a.reviewer.lastname ?
    a.reviewer.lastname.toLowerCase().charAt(0).toUpperCase() + a.reviewer.lastname.toLowerCase().slice(1) : '';
  const nameB = b.reviewer.lastname ?
    b.reviewer.lastname.toLowerCase().charAt(0).toUpperCase() + b.reviewer.lastname.toLowerCase().slice(1) : '';

  if (nameA < nameB) {
    return -1;
  }
  if (nameA > nameB) {
    return 1;
  }
  return 0;
}

/*
 * Load community and append to req.
 */
function loadCommunity(req, res, next, id) {
  Community.find(id !== config['senior-orange-experts-flag'].toString() ? {'_id': id} : {flag: {$bitsAnySet: config['orange-experts'].communitiesGroupFlag}})
      .exec()
      .then((communities) => {
        return redisClient.hGetAll('oemarew:' + id)
            .then((obj) => {
              if (Object.prototype.toString.call(obj) === '[object Object]' && JSON.stringify(obj) === '{}') {
                obj = {
                  startReviewing: 0,
                  canAssignReviewers: 0,
                  lockReviewers: 0,
                  visibleReviews: 0,
                  hiddenColumnsFromReviewers: '',
                };
              }
              return [communities, obj];
            });
      })
      .then((result) => {
        const [communities, reviewSettings] = result;

        // Set missing properties to default values
        reviewSettings.startReviewing ??= 0;
        reviewSettings.canAssignReviewers ??= 0;
        reviewSettings.lockReviewers ??= 0;
        reviewSettings.visibleReviews ??= 0;
        reviewSettings.hiddenColumnsFromReviewers ??= '';

        const theFlag = communities[0].flag & 262143; // 11 1111 1111 1111 1111
        let redisLabel;
        if (theFlag < config['orange-experts'].communitiesGroupFlag) {
          redisLabel = config['orange-experts'].redis;
        } else if (theFlag === config['experts-dtsi'].communitiesGroupFlag) {
          redisLabel = config['experts-dtsi'].redis;
        } else if (theFlag === config['security-school'].communitiesGroupFlag) {
          redisLabel = config['security-school'].redis;
        }
        return redisClient.get(redisLabel)
            .then((value) => {
              if (communities.length === 1) {
                req.community = communities[0];
              } else {
                req.communities = communities;
              }
              if (value) {
                req.settings = Object.assign({cannotSubmitForms: value}, reviewSettings);
              } else {
                req.settings = Object.assign({cannotSubmitForms: 0}, reviewSettings);
              }
              next();
            });
      })
      .catch((e) => next(e));
}

/*
 * Retrieve the reviews page settings configured by a community.
 */
function getReviewSettings(req, res, next) {
  res.json(req.settings);
}

/*
 * Configure the reviews page settings for a community.
 */
function putReviewSettings(req, res, next) {
  const settings = req.settings;

  redisClient.multi()
      .hSet('oemarew:' + req.params.communityId,
          'startReviewing', req.body.startReviewing ?? settings.startReviewing)
      .hSet('oemarew:' + req.params.communityId,
          'canAssignReviewers', req.body.canAssignReviewers ?? settings.canAssignReviewers)
      .hSet('oemarew:' + req.params.communityId,
          'lockReviewers', req.body.lockReviewers ?? settings.lockReviewers)
      .hSet('oemarew:' + req.params.communityId,
          'visibleReviews', req.body.visibleReviews ?? settings.visibleReviews)
      .hSet('oemarew:' + req.params.communityId,
          'hiddenColumnsFromReviewers', req.body.hiddenColumnsFromReviewers ?? settings.hiddenColumnsFromReviewers,
      )
      .exec()
      .then((reply) => res.json({success: true, message: 'Successfully updated the review settings.'}))
      .catch((e) => next(e));
}

/*
 * Get the number of applications to review for a community,
 * identified by its name in the query parameter `req.query.community`.
 * In case of Orange Experts, also count nb of Senior apps.
 */
function getNbAppsToReview(req, res, next) {
  const communities = req.communities || [req.community];

  Community.findOne({'_id': communities[0]._id}).exec()
      .then((community) => {
        const theFlag = community.flag & 262143; // 11 1111 1111 1111 1111 (all Orange Expert communities + DTSI + Data'Up)
        let inclSenior = false;
        let redisLabel;
        if (theFlag < config['orange-experts'].communitiesGroupFlag) {
          redisLabel = config['orange-experts'].redis;
          inclSenior = true;
        } else if (theFlag === config['experts-dtsi'].communitiesGroupFlag) {
          redisLabel = config['experts-dtsi'].redis;
        } else if (theFlag === config['security-school'].communitiesGroupFlag) {
          redisLabel = config['security-school'].redis;
        }
        return redisClient.get(redisLabel)
            .then((value) => [community, inclSenior, value ? parseInt(value) + 1 : 1 + new Date().getFullYear()]);
      })
      .then((result) => {
        const [community, inclSenior, thisYear] = result;
        if ((req.session.user.role.referent & community.flag) != 0) {
          // only for Referent !
          return Reviews[community.label].countDocuments({
            $and: [
              {year: {$eq: thisYear}},
              {'applicant.email': {$ne: req.session.user.email}}, // for referent who also candidates...
              {'deliberation.recommendation': {$nin: ['Approved', 'Rejected']}},
            ],
          })
              .then((count) => [inclSenior, thisYear, count]);
        }

        // for Admin who is also a reviewer (for other Reviewers, this will be done when getting profile in auth.controller.js)
        return Reviews[community.label].countDocuments({
          $and: [
            {year: {$eq: thisYear}},
            {reviewers: {$elemMatch: {
              reviewer: {$eq: req.session.user.id},
              reviews: {$eq: 'yes'},
              $or: [{'rating.rate': {$eq: ''}},
                {comments: {$eq: ''}}],
            }}},
          ],
        })
            .then((count) => [inclSenior, thisYear, count]);
      })
      .then(async (result) => {
        const [inclSenior, thisYear, count] = result;
        if (inclSenior) {
          let seniorReviewCount = 0;
          if (req.session.user.role.referent != 0) {
            // for Referent
            for (const community of communities) {
              seniorReviewCount += await Reviews[`Senior${community.label}`].countDocuments({
                $and: [
                  {year: {$eq: thisYear}},
                  {'applicant.email': {$ne: req.session.user.email}}, // for referent who also candidates...
                  {'deliberation.recommendation': {$nin: ['Approved', 'Rejected']}},
                ],
              });
            }

            return res.json({nbAppsToReview: count, nbSeniorAppsToReview: seniorReviewCount});
          }

          // for Admin
          for (const community of communities) {
            seniorReviewCount += await Reviews[`Senior${community.label}`].countDocuments({
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

          res.json({nbAppsToReview: count, nbSeniorAppsToReview: seniorReviewCount});
        } else {
          res.json({nbAppsToReview: count});
        }
      })
      .catch((e) => next(e));
}

/*
 * Build the review table for the community req.params.communityId.
 */
async function buildReviewCollection(req, res, next) {
  const communities = req.communities || [req.community];
  const settings = req.settings;

  const thisYear = settings.cannotSubmitForms ? parseInt(settings.cannotSubmitForms) + 1 : (1 + new Date().getFullYear());

  const results = [];

  try {
    for (const community of communities) {
      const forms = await Forms[req.query.type ? `Senior${community.label}` : community.label].aggregate([
        {
          $match: {year: {$eq: thisYear}, submittedAt: {$ne: null}},
        },
        {
          $lookup:
          {
            from: (req.query.type ? `Senior${community.label}Reviews` : `${community.label}Reviews`)
                .toLowerCase(),
            localField: '_id',
            foreignField: 'formId',
            as: 'review',
          },
        },
        {
          $match: {
            'review.formId': {
              $exists: false,
            },
          },
        },
        {
          $lookup:
          {
            from: 'users',
            localField: 'email',
            foreignField: 'email',
            as: 'applicant',
          },
        },
        {
          $project: {
            'formId': '$_id', '_id': 0, 'formType': 1, 'year': 1, 'userAnsweredForm': 1,
            'applicant.email': 1, 'applicant.cuid': 1, 'applicant.role': 1, 'applicant.firstname': 1, 'applicant.lastname': 1,
            'applicant.gender': 1, 'applicant.birthday': 1, 'applicant.phone': 1, 'applicant.classification': 1,
            'applicant.entity': 1, 'applicant.location': 1, 'applicant.country': 1,
            'applicant.managerFirstname': 1, 'applicant.managerLastname': 1, 'applicant.managerEmail': 1,
            'applicant.hrFirstname': 1, 'applicant.hrLastname': 1, 'applicant.hrEmail': 1,
            'applicant.history': 1, 'applicant._id': 1,
            /* communityId: {$literal: community.id},*/
            'notesAboutApplicant': {$literal: ''},
            'reviewers': {
              $map: {
                input: {$literal: req.query.type ? community.seniorReviewers : community.reviewers},
                as: 'reviewerId',
                in: {
                  reviewer: '$$reviewerId',
                  reviews: {$literal: ''},
                  rating: {
                    $literal: {
                      rate: '',
                    },
                  },
                  comments: {$literal: ''},
                },
              },
            },
            'rate': {
              $literal: {
                'strong-accept': '',
                'weak-accept': '',
                'fair': '',
                'weak-reject': '',
                'strong-reject': '',
                'total-score': '',
                'rate-count': '',
                'avg-score': '',
                'std-dev-score': '',
              },
            },
            'deliberation': {
              $literal: {
                comments: '',
                status: '',
                recommendation: '',
                notes: '',
              },
            },
            'notification': {$literal: ''},
          },
        },
        {
          $unwind: '$applicant',
        },
        {
          $match: req.query.type ? {
            'applicant.role.referent': {$bitsAllClear: config['senior-orange-experts-flag']},
          } : {
            'applicant.email': {$ne: community.referentMail}, // !!! exclude main referents' applications !!!
          },
        },
      ]).exec();

      for (const form of forms) {
        form['userAppFormData'] = {};
        // do not use form.formTemplate, but retrieve the more updated version from community
        let formTemplate;
        if (req.query.type === 'senior') {
          if (form.formType == 'new') {
            formTemplate = community.newSeniorForm;
          } else {
            formTemplate = community.renewalSeniorForm;
          }
        } else {
          if (form.formType == 'new') {
            formTemplate = community.newForm;
          } else {
            formTemplate = community.renewalForm;
          }
        }
        // build form.userAppFormData from formTemplate and form.userAnsweredForm, then delete userAnsweredForm from form
        for (const step of formTemplate) {
          if (step.form != null) {
            for (const formGrp of step.form) {
              if (formGrp.questions != null) {
                for (const question of formGrp.questions) {
                  if (question.options && question.options.review) {
                    form.userAppFormData[question.name] = {
                      label: question.label,
                      type: question.type,
                      options: question.options,
                      answer: form.userAnsweredForm[question.name],
                    };
                  }
                }
              }
            }
          }
        }

        delete form.userAnsweredForm;
      }

      await Reviews[req.query.type ? `Senior${community.label}` : community.label].insertMany(forms);

      const reviews = await Reviews[req.query.type ? `Senior${community.label}` : community.label].aggregate([
        {
          $match: {year: {$eq: thisYear}},
        },
        {
          $project: {
            'applicant._id': 1,
            'applicant.email': 1,
            'applicant.firstname': 1,
            'applicant.lastname': 1,
            'applicant.managerEmail': 1,
            'applicant.hrEmail': 1,
            'applicant.history': 1,
            'formId': 1,
            'formType': 1,
            'year': 1,
            'userAppFormData': 1,
            'reviewers': 1,
            'rate': 1,
            'deliberation': 1,
            'notification': 1,
          },
        },
      ]).exec();

      const populatedReviews = await User.populate(reviews, {path: 'reviewers.reviewer', select: '_id firstname lastname email'});

      for (const review of populatedReviews) {
        for (const p in review.userAppFormData) {
          if ({}.hasOwnProperty.call(review.userAppFormData, p)) {
            delete review.userAppFormData[p].label;
            delete review.userAppFormData[p].type;
            delete review.userAppFormData[p].options;
          }
        }

        review.reviewers.sort(orderReviewers);

        review['communityId'] = community._id;
        review['communityName'] = community.name;
      }

      results.push(...populatedReviews);
    }

    res.json(results);
  } catch (e) {
    next(e);
  }
}

/*
 * REbuild the review table for the community req.params.communityId.
 */
async function rebuildReviewCollection(req, res, next) {
  const communities = req.communities || [req.community];
  const settings = req.settings;
  const hiddenColumns = settings?.hiddenColumnsFromReviewers?.split(',');

  if (!req.community || !hiddenColumns) {
    const err = new APIError('Ooops, unexpected error!', httpStatus.INTERNAL_SERVER_ERROR, true);
    return next(err);
  }

  const thisYear = settings.cannotSubmitForms ? parseInt(settings.cannotSubmitForms) + 1 : (1 + new Date().getFullYear());

  const results = [];

  try {
    for (const community of communities) {
      const forms = await Forms[req.query.type ? `Senior${community.label}` : community.label].aggregate([
        {
          $match: {year: {$eq: thisYear}, submittedAt: {$ne: null}},
        },
        {
          $lookup:
          {
            from: 'users',
            localField: 'email',
            foreignField: 'email',
            as: 'updatedApplicant',
          },
        },
        {
          $project: {
            'formId': '$_id', '_id': 0, 'formType': 1, 'year': 1, 'userAnsweredForm': 1,
            'updatedApplicant.email': 1, 'updatedApplicant.cuid': 1, 'updatedApplicant.role': 1,
            'updatedApplicant.firstname': 1, 'updatedApplicant.lastname': 1, 'updatedApplicant.gender': 1,
            'updatedApplicant.birthday': 1, 'updatedApplicant.phone': 1, 'updatedApplicant.classification': 1,
            'updatedApplicant.entity': 1, 'updatedApplicant.location': 1, 'updatedApplicant.country': 1,
            'updatedApplicant.managerFirstname': 1, 'updatedApplicant.managerLastname': 1, 'updatedApplicant.managerEmail': 1,
            'updatedApplicant.hrFirstname': 1, 'updatedApplicant.hrLastname': 1, 'updatedApplicant.hrEmail': 1,
            'updatedApplicant.history': 1, 'updatedApplicant._id': 1,
          },
        },
        {
          $unwind: '$updatedApplicant',
        },
        {
          $match: req.query.type ? {
            'updatedApplicant.role.referent': {$bitsAllClear: config['senior-orange-experts-flag']},
          } : {
            'updatedApplicant.email': {$ne: community.referentMail}, // exclude main referents' applications
          },
        },
      ]).exec();

      for (const form of forms) {
        form['userAppFormData'] = {};
        // do not use form.formTemplate, but retrieve the more updated version from community
        let formTemplate;
        if (req.query.type === 'senior') {
          if (form.formType == 'new') {
            formTemplate = community.newSeniorForm;
          } else {
            formTemplate = community.renewalSeniorForm;
          }
        } else {
          if (form.formType == 'new') {
            formTemplate = community.newForm;
          } else {
            formTemplate = community.renewalForm;
          }
        }

        // build form.userAppFormData from form.formTemplate and form.userAnsweredForm, then delete formTemplate and userAnsweredForm from form
        for (const step of formTemplate) {
          if (step.form) {
            for (const formGrp of step.form) {
              if (formGrp.questions) {
                for (const question of formGrp.questions) {
                  if (question.options && question.options.review) {
                    form.userAppFormData[question.name] = {
                      label: question.label,
                      type: question.type,
                      options: question.options,
                      answer: form.userAnsweredForm[question.name],
                    };
                  }
                }
              }
            }
          }
        }

        delete form.userAnsweredForm;
      }

      const updates = [];
      forms.forEach(function(item) {
        const updatePromise = Reviews[req.query.type ? `Senior${community.label}` : community.label]
            .findOneAndUpdate({formId: item.formId, year: item.year}, {
              '$set': {
                'formType': item.formType,
                'userAppFormData': item.userAppFormData,
                'applicant.email': item.updatedApplicant.email, 'applicant.cuid': item.updatedApplicant.cuid, 'applicant.role': item.updatedApplicant.role,
                'applicant.firstname': item.updatedApplicant.firstname, 'applicant.lastname': item.updatedApplicant.lastname,
                'applicant.gender': item.updatedApplicant.gender,
                'applicant.birthday': item.updatedApplicant.birthday, 'applicant.phone': item.updatedApplicant.phone,
                'applicant.classification': item.updatedApplicant.classification, 'applicant.entity': item.updatedApplicant.entity,
                'applicant.location': item.updatedApplicant.location, 'applicant.country': item.updatedApplicant.country,
                'applicant.managerFirstname': item.updatedApplicant.managerFirstname, 'applicant.managerLastname': item.updatedApplicant.managerLastname,
                'applicant.managerEmail': item.updatedApplicant.managerEmail,
                'applicant.hrFirstname': item.updatedApplicant.hrFirstname, 'applicant.hrLastname': item.updatedApplicant.hrLastname,
                'applicant.hrEmail': item.updatedApplicant.hrEmail,
                'applicant.history': item.updatedApplicant.history, 'applicant._id': item.updatedApplicant['_id'],
              },
            }, {'new': true, 'upsert': true, 'useFindAndModify': false});
        updates.push(updatePromise);
      });

      let reviews = await Promise.all(updates);
      for (const review of reviews) {
        if (review.reviewers) {
          // Remove duplicated reviewers if any
          const arr = review.reviewers;
          const uniqueArray = arr.filter(function(elem, pos) {
            return arr.findIndex((element) => element.reviewer.equals(elem.reviewer)) == pos;
          });
          if (arr.length !== uniqueArray.length) {
            review.reviewers = uniqueArray;
            await review.save();
          }
        }
      }

      // Get reviewers to add into newly inserted reviews
      let reviewerList;
      if (req.query.type) {
        reviewerList = community.seniorReviewers;
      } else {
        reviewerList = community.reviewers;
      }

      const mapReviewers = reviewerList.map((r) => {
        return {
          reviewer: r,
          reviews: '',
          rating: {
            rate: '',
          },
          comments: '',
        };
      });

      await Reviews[req.query.type ? `Senior${community.label}` : community.label]
          .updateMany({notesAboutApplicant: {$exists: false}, year: {$eq: thisYear}}, {
            '$set': {
              notesAboutApplicant: '',
              reviewers: mapReviewers,
              rate: {
                'strong-accept': '',
                'weak-accept': '',
                'fair': '',
                'weak-reject': '',
                'strong-reject': '',
                'total-score': '',
                'rate-count': '',
                'avg-score': '',
                'std-dev-score': '',
              },
              deliberation: {
                comments: '',
                status: '',
                recommendation: '',
                notes: '',
              },

            },
          }).exec();

      reviews = await Reviews[req.query.type ? `Senior${community.label}` : community.label].aggregate([
        {
          $match: {year: {$eq: thisYear}},
        },
        {
          $project: {
            'applicant._id': 1,
            'applicant.email': 1,
            'applicant.firstname': 1,
            'applicant.lastname': 1,
            'applicant.managerEmail': 1,
            'applicant.hrEmail': 1,
            'applicant.history': 1,
            'formId': 1,
            'formType': 1,
            'year': 1,
            'userAppFormData': 1,
            'reviewers': 1,
            'rate': 1,
            'deliberation': 1,
            'notification': 1,
          },
        },
        {
          $match: {
            'applicant.email': {$ne: req.session.user.email}, // exclude user's application
          },
        },
      ]).exec();

      const populatedReviews = await User.populate(reviews, {path: 'reviewers.reviewer', select: '_id firstname lastname email'});

      for (const review of populatedReviews) {
        let nbReviewers = 0; let nbRates = 0;
        for (const reviewer of review.reviewers) {
          if (reviewer.reviews === 'yes') {
            nbReviewers += 1;
            if (reviewer.rating.rate != '') {
              nbRates += 1;
            }
          }
        }

        review.rate['rate-count'] = nbReviewers;
        review.rate['review-count'] = nbRates;

        // check settings by the Referent
        if (req.session.user.role.referent == 0) {
        // remove hidden columns if any
          if (hiddenColumns.indexOf('strong-accept') != -1) {
            delete review.rate['strong-accept'];
          }
          if (hiddenColumns.indexOf('weak-accept') != -1) {
            delete review.rate['weak-accept'];
          }
          if (hiddenColumns.indexOf('fair') != -1) {
            delete review.rate.fair;
          }
          if (hiddenColumns.indexOf('weak-reject') != -1) {
            delete review.rate['weak-reject'];
          }
          if (hiddenColumns.indexOf('strong-reject') != -1) {
            delete review.rate['strong-reject'];
          }
          if (hiddenColumns.indexOf('total-score') != -1) {
            delete review.rate['total-score'];
          }
          if (hiddenColumns.indexOf('rate-count') != -1) {
            delete review.rate['rate-count'];
          }
          if (hiddenColumns.indexOf('review-count') != -1) {
            delete review.rate['review-count'];
          }
          if (hiddenColumns.indexOf('avg-score') != -1) {
            delete review.rate['avg-score'];
          }
          if (hiddenColumns.indexOf('std-dev-score') != -1) {
            delete review.rate['std-dev-score'];
          }

          if (hiddenColumns.indexOf('final-review-comments') != -1) {
            delete review.deliberation.comments;
            delete review.deliberation.notes;
          }
          if (hiddenColumns.indexOf('final-review-status') != -1) {
            delete review.deliberation.status;
          }
          if (hiddenColumns.indexOf('final-review-recommendation') != -1) {
            delete review.deliberation.recommendation;
          }

          // visibleReviews ? Allow a reviewer to see other reviews ?
          if (settings.visibleReviews == 0) {
            for (const reviewer of review.reviewers) {
              if (reviewer.reviewer['_id'] != req.session.user.id) {
                reviewer.rating.rate = '';
                reviewer.comments = '';
              }
            }
          }
        }

        for (const p in review.userAppFormData) {
          if ({}.hasOwnProperty.call(review.userAppFormData, p)) {
            delete review.userAppFormData[p].label;
            delete review.userAppFormData[p].type;
            delete review.userAppFormData[p].options;
          }
        }

        review.reviewers.sort(orderReviewers);

        review['communityId'] = community._id;
        review['communityName'] = community.name;
      }

      results.push(...populatedReviews);
    }

    res.json(results);
  } catch (e) {
    next(e);
  }
}

/*
 * Get the review list from the community req.params.communityId.
 */
async function list(req, res, next) {
  const communities = req.communities || [req.community];
  const settings = req.settings;
  const hiddenColumns = settings?.hiddenColumnsFromReviewers?.split(',') ?? settings?.hiddenColumnsFromReviewers ?? [];

  if (!communities || !hiddenColumns) {
    const err = new APIError('Ooops, unexpected error!', httpStatus.INTERNAL_SERVER_ERROR, true);
    return next(err);
  }

  const results = [];

  try {
    for (const community of communities) {
      const reviews = await Reviews[req.query.type ? `Senior${community.label}` : community.label].list(req.query);
      const populatedReviews = await User.populate(reviews, {path: 'reviewers.reviewer', select: '_id firstname lastname email'});

      for (const review of populatedReviews) {
        let nbReviewers = 0; let nbRates = 0;
        for (const reviewer of review.reviewers) {
          if (reviewer.reviews === 'yes') {
            nbReviewers += 1;
            if (reviewer.rating.rate != '') {
              nbRates += 1;
            }
          }
        }

        review.rate['rate-count'] = nbReviewers;
        review.rate['review-count'] = nbRates;

        // check settings by the Referent
        if (req.session.user.role.referent == 0) {
        // remove hidden columns if any
          if (hiddenColumns.indexOf('strong-accept') != -1) {
            delete review.rate['strong-accept'];
          }
          if (hiddenColumns.indexOf('weak-accept') != -1) {
            delete review.rate['weak-accept'];
          }
          if (hiddenColumns.indexOf('fair') != -1) {
            delete review.rate.fair;
          }
          if (hiddenColumns.indexOf('weak-reject') != -1) {
            delete review.rate['weak-reject'];
          }
          if (hiddenColumns.indexOf('strong-reject') != -1) {
            delete review.rate['strong-reject'];
          }
          if (hiddenColumns.indexOf('total-score') != -1) {
            delete review.rate['total-score'];
          }
          if (hiddenColumns.indexOf('rate-count') != -1) {
            delete review.rate['rate-count'];
          }
          if (hiddenColumns.indexOf('review-count') != -1) {
            delete review.rate['review-count'];
          }
          if (hiddenColumns.indexOf('avg-score') != -1) {
            delete review.rate['avg-score'];
          }
          if (hiddenColumns.indexOf('std-dev-score') != -1) {
            delete review.rate['std-dev-score'];
          }

          if (hiddenColumns.indexOf('final-review-comments') != -1) {
            delete review.deliberation.comments;
            delete review.deliberation.notes;
          }
          if (hiddenColumns.indexOf('final-review-status') != -1) {
            delete review.deliberation.status;
          }
          if (hiddenColumns.indexOf('final-review-recommendation') != -1) {
            delete review.deliberation.recommendation;
          }

          // visibleReviews ? Allow a reviewer to see other reviews ?
          if (settings.visibleReviews == 0) {
            for (const reviewer of review.reviewers) {
              if (reviewer.reviewer['_id'] != req.session.user.id) {
                reviewer.rating.rate = '';
                reviewer.comments = '';
              }
            }
          }
        }

        if (!req.query.template) {
          // Keep only user answers (i.e. we remove all items used to render the application form)
          for (const p in review.userAppFormData) {
            if ({}.hasOwnProperty.call(review.userAppFormData, p)) {
              delete review.userAppFormData[p].label;
              delete review.userAppFormData[p].type;
              delete review.userAppFormData[p].options;
            }
          }
        }

        review.reviewers.sort(orderReviewers);

        review['communityId'] = community._id;
        review['communityName'] = community.name;

        const doesExist = await Forms[req.query.type ? `Senior${community.label}` : community.label].countDocuments({_id: review.formId});

        if (!doesExist) {
          review['deadForm'] = 1;
        }
      }

      results.push(...populatedReviews);
    }

    res.json(results);
  } catch (e) {
    next(e);
  }
}

/*
 * Create a new review for the community req.params.communityId.
 */
function create(req, res, next) {
  const community = req.community;
  const settings = req.settings;

  const thisYear = settings.cannotSubmitForms ?
    parseInt(settings.cannotSubmitForms) + 1 : (1 + new Date().getFullYear());

  Forms[req.query.type ? `Senior${community.label}` : community.label].aggregate([
    {
      $match: {
        '_id': {$eq: mongoose.Types.ObjectId.createFromHexString(req.body.formId)},
        'year': {$eq: thisYear},
        'submittedAt': {$ne: null},
      },
    },
    {
      $lookup:
      {
        from: 'users',
        localField: 'email',
        foreignField: 'email',
        as: 'applicant',
      },
    },
    {
      $project: {
        'formId': '$_id', '_id': 0, 'formType': 1, 'year': 1, 'userAnsweredForm': 1,
        'applicant.email': 1, 'applicant.cuid': 1, 'applicant.role': 1,
        'applicant.firstname': 1, 'applicant.lastname': 1, 'applicant.gender': 1,
        'applicant.birthday': 1, 'applicant.phone': 1, 'applicant.classification': 1,
        'applicant.entity': 1, 'applicant.location': 1, 'applicant.country': 1,
        'applicant.managerFirstname': 1, 'applicant.managerLastname': 1, 'applicant.managerEmail': 1,
        'applicant.hrFirstname': 1, 'applicant.hrLastname': 1, 'applicant.hrEmail': 1,
        'applicant.history': 1, 'applicant._id': 1,
        /* communityId: {$literal: community.id},*/
        'notesAboutApplicant': {$literal: ''},
        'reviewers': {
          $map: {
            input: {$literal: req.query.type ? community.seniorReviewers : community.reviewers},
            as: 'reviewerId',
            in: {
              reviewer: '$$reviewerId',
              reviews: {$literal: ''},
              rating: {
                $literal: {
                  rate: '',
                },
              },
              comments: {$literal: ''},
            },
          },
        },
        'rate': {
          $literal: {
            'strong-accept': '',
            'weak-accept': '',
            'fair': '',
            'weak-reject': '',
            'strong-reject': '',
            'total-score': '',
            'rate-count': '',
            'avg-score': '',
            'std-dev-score': '',
          },
        },
        'deliberation': {
          $literal: {
            comments: '',
            status: '',
            recommendation: '',
            notes: '',
          },
        },
        'notification': {$literal: ''},
      },
    },
    {
      $unwind: '$applicant',
    },
  ]).exec()
      .then((forms) => {
        const form = forms[0];
        form['userAppFormData'] = {};
        // do not use form.formTemplate, but retrieve the more updated version from community
        let formTemplate;
        if (req.query.type === 'senior') {
          if (form.formType == 'new') {
            formTemplate = community.newSeniorForm;
          } else {
            formTemplate = community.renewalSeniorForm;
          }
        } else {
          if (form.formType == 'new') {
            formTemplate = community.newForm;
          } else {
            formTemplate = community.renewalForm;
          }
        }

        // Build form.userAppFormData from form.formTemplate and form.userAnsweredForm,
        // then delete formTemplate and userAnsweredForm from form
        for (const step of formTemplate) {
          if (step.form != null) {
            for (const formGrp of step.form) {
              if (formGrp.questions != null) {
                for (const question of formGrp.questions) {
                  if (question.options && question.options.review) {
                    form.userAppFormData[question.name] = {
                      label: question.label,
                      type: question.type,
                      options: question.options,
                      answer: form.userAnsweredForm[question.name],
                    };
                  }
                }
              }
            }
          }
        }

        delete form.userAnsweredForm;

        return Reviews[req.query.type ? `Senior${community.label}` : community.label].findOneAndUpdate(
            {formId: mongoose.Types.ObjectId.createFromHexString(req.body.formId)},
            {'$setOnInsert': form},
            {'upsert': true, 'new': true, 'useFindAndModify': false},
        );
      })
      .then((_) => {
        return Reviews[req.query.type ? `Senior${community.label}` : community.label].aggregate([
          {
            $match: {year: {$eq: thisYear}, formId: {$eq: mongoose.Types.ObjectId.createFromHexString(req.body.formId)}},
          },
          {
            $project: {
              'applicant._id': 1,
              'applicant.email': 1,
              'applicant.firstname': 1,
              'applicant.lastname': 1,
              'applicant.managerEmail': 1,
              'applicant.hrEmail': 1,
              'formId': 1,
              'formType': 1,
              'year': 1,
              'userAppFormData': 1,
              'reviewers': 1,
              'rate': 1,
              'deliberation': 1,
              'notification': 1,
            },
          },
        ]).exec();
      })
      .then((reviews) => {
        return User.populate(reviews, {path: 'reviewers.reviewer', select: '_id firstname lastname email'})
            .then((populatedReviews) => {
              for (const review of populatedReviews) {
                for (const p in review.userAppFormData) {
                  if ({}.hasOwnProperty.call(review.userAppFormData, p)) {
                    delete review.userAppFormData[p].label;
                    delete review.userAppFormData[p].type;
                    delete review.userAppFormData[p].options;
                  }
                }

                review.reviewers.sort(orderReviewers);
              }

              res.json(populatedReviews[0]);
            });
      })
      .catch((e) => next(e));
}

/*
 * Get application review by its ID
 */
function get(req, res, next) {
  const community = req.community;
  const settings = req.settings;
  const hiddenColumns = settings?.hiddenColumnsFromReviewers?.split(',');

  if (!req.community || !hiddenColumns) {
    const err = new APIError('Ooops, unexpected error!', httpStatus.INTERNAL_SERVER_ERROR, true);
    return next(err);
  }

  Reviews[req.query.type ? `Senior${community.label}` : community.label].get(req.params.reviewId)
      .then((review) => {
        let nbReviewers = 0; let nbRates = 0;
        for (const reviewer of review.reviewers) {
          if (reviewer.reviews === 'yes') {
            nbReviewers += 1;
            if (reviewer.rating.rate != '') {
              nbRates += 1;
            }
          }
        }

        review.rate['rate-count'] = nbReviewers;
        review.rate['review-count'] = nbRates;

        // check settings by the Referent
        if (req.session.user.role.referent == 0) {
        // remove hidden columns if any
          if (hiddenColumns.indexOf('strong-accept') != -1) {
            delete review.rate['strong-accept'];
          }
          if (hiddenColumns.indexOf('weak-accept') != -1) {
            delete review.rate['weak-accept'];
          }
          if (hiddenColumns.indexOf('fair') != -1) {
            delete review.rate.fair;
          }
          if (hiddenColumns.indexOf('weak-reject') != -1) {
            delete review.rate['weak-reject'];
          }
          if (hiddenColumns.indexOf('strong-reject') != -1) {
            delete review.rate['strong-reject'];
          }
          if (hiddenColumns.indexOf('total-score') != -1) {
            delete review.rate['total-score'];
          }
          if (hiddenColumns.indexOf('rate-count') != -1) {
            delete review.rate['rate-count'];
          }
          if (hiddenColumns.indexOf('review-count') != -1) {
            delete review.rate['review-count'];
          }
          if (hiddenColumns.indexOf('avg-score') != -1) {
            delete review.rate['avg-score'];
          }
          if (hiddenColumns.indexOf('std-dev-score') != -1) {
            delete review.rate['std-dev-score'];
          }

          if (hiddenColumns.indexOf('final-review-comments') != -1) {
            delete review.deliberation.comments;
            delete review.deliberation.notes;
          }
          if (hiddenColumns.indexOf('final-review-status') != -1) {
            delete review.deliberation.status;
          }
          if (hiddenColumns.indexOf('final-review-recommendation') != -1) {
            delete review.deliberation.recommendation;
          }

          // visibleReviews ? Allow a reviewer to see other reviews ?
          if (settings.visibleReviews == 0) {
            for (const reviewer of review.reviewers) {
              if (reviewer.reviewer != req.session.user.id) {
                reviewer.rating.rate = '';
                reviewer.comments = '';
              }
            }
          }
        }

        for (const p in review.userAppFormData) {
          if ({}.hasOwnProperty.call(review.userAppFormData, p)) {
            delete review.userAppFormData[p].label;
            delete review.userAppFormData[p].type;
            delete review.userAppFormData[p].options;
          }
        }

        return User.populate(review, {path: 'reviewers.reviewer', select: '_id firstname lastname email'})
            .then((populatedReview) => res.json(populatedReview));
      })
      .catch((e) => next(e));
}

/*
 * Update review reviewId in the collection of communityId
 */
function update(req, res, next) {
  const community = req.community;
  const settings = req.settings;
  const hiddenColumns = settings?.hiddenColumnsFromReviewers?.split(',');

  if (!req.community || !hiddenColumns) {
    const err = new APIError('Ooops, unexpected error!', httpStatus.INTERNAL_SERVER_ERROR, true);
    return next(err);
  }

  Reviews[req.query.type ? `Senior${community.label}` : community.label].findById(req.params.reviewId).exec()
      .then((review) => {
        if (!review) {
          const err = new APIError('Review not found.', httpStatus.BAD_REQUEST, true);
          return next(err);
        }

        if (req.body.reviewer) {
          if (req.session.user.role.referent == 0 && settings.lockReviewers == 1) {
            const err = new APIError('Reviews are closed by the referent. You cannot modify your reviews anymore.',
                httpStatus.UNAUTHORIZED, true);
            throw err;
          }
          let nbStrAccept = 0; let nbWeaAccept = 0; let nbFair = 0;
          let nbWeaReject = 0; let nbStrReject = 0; let nbReviewers = 0; let nbRates = 0;
          for (const reviewer of review.reviewers) {
            if (reviewer.reviewer == req.body.reviewer.reviewer) {
            // check if reviewer.reviews can be changed
              if (req.session.user.role.referent == 0 && settings.canAssignReviewers == 0 &&
              (req.body.reviewer.reviews != reviewer.reviews || reviewer.reviews === '')) {
                const err = new APIError('You are not authorized to make the review.',
                    httpStatus.UNAUTHORIZED, true);
                throw err;
              } else {
                Object.assign(reviewer, req.body.reviewer);
              }
            }
            if (reviewer.reviews !== 'no' && reviewer.reviews !== '') {
              if (reviewer.reviews === 'yes') {
                nbReviewers += 1;
              }

              if (reviewer.rating.rate != '') {
                if (reviewer.reviews === 'maybe') {
                  nbReviewers += 1;
                  reviewer.reviews = 'yes';
                }

                nbRates += 1;

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
          if (nbRates > 0) {
            const totalScore = nbStrAccept * 2 + nbWeaAccept - nbWeaReject - nbStrReject * 2;
            const avgScore = totalScore / nbRates;
            const stdDevScore = Math.sqrt(
                (nbStrAccept * (2 - avgScore) * (2 - avgScore) +
            nbWeaAccept * (1 - avgScore) * (1 - avgScore) +
            nbFair * avgScore * avgScore +
            nbWeaReject * (1 + avgScore) * (1 + avgScore) +
            nbStrReject * (2 + avgScore) * (2 + avgScore)) / nbRates);
            // update review.rate!
            review.rate = {
              'strong-accept': nbStrAccept,
              'weak-accept': nbWeaAccept,
              'fair': nbFair,
              'weak-reject': nbWeaReject,
              'strong-reject': nbStrReject,
              'total-score': totalScore,
              'rate-count': nbReviewers,
              'review-count': nbRates,
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
              'rate-count': nbReviewers,
              'review-count': 0,
              'avg-score': 0.00.toFixed(2),
              'std-dev-score': 0.00.toFixed(2),
            };
          }

          delete req.body.reviewer;
        }

        Object.assign(review, req.body);

        return review.save()
            .then((updatedReview) => {
              if (req.session.user.role.referent == 0) {
                // remove hidden columns if any
                if (hiddenColumns.indexOf('strong-accept') != -1) {
                  delete updatedReview.rate['strong-accept'];
                }
                if (hiddenColumns.indexOf('weak-accept') != -1) {
                  delete updatedReview.rate['weak-accept'];
                }
                if (hiddenColumns.indexOf('fair') != -1) {
                  delete updatedReview.rate.fair;
                }
                if (hiddenColumns.indexOf('weak-reject') != -1) {
                  delete updatedReview.rate['weak-reject'];
                }
                if (hiddenColumns.indexOf('strong-reject') != -1) {
                  delete updatedReview.rate['strong-reject'];
                }
                if (hiddenColumns.indexOf('total-score') != -1) {
                  delete updatedReview.rate['total-score'];
                }
                if (hiddenColumns.indexOf('rate-count') != -1) {
                  delete updatedReview.rate['rate-count'];
                }
                if (hiddenColumns.indexOf('review-count') != -1) {
                  delete updatedReview.rate['review-count'];
                }
                if (hiddenColumns.indexOf('avg-score') != -1) {
                  delete updatedReview.rate['avg-score'];
                }
                if (hiddenColumns.indexOf('std-dev-score') != -1) {
                  delete updatedReview.rate['std-dev-score'];
                }

                if (hiddenColumns.indexOf('final-review-comments') != -1) {
                  delete updatedReview.deliberation.comments;
                  delete updatedReview.deliberation.notes;
                }
                if (hiddenColumns.indexOf('final-review-status') != -1) {
                  delete updatedReview.deliberation.status;
                }
                if (hiddenColumns.indexOf('final-review-recommendation') != -1) {
                  delete updatedReview.deliberation.recommendation;
                }

                // visibleReviews ? Allow a reviewer to see other reviews ?
                if (settings.visibleReviews == 0) {
                  for (const reviewer of updatedReview.reviewers) {
                    if (reviewer.reviewer != req.session.user.id) {
                      reviewer.rating.rate = '';
                      reviewer.comments = '';
                    }
                  }
                }
              }

              for (const p in updatedReview.userAppFormData) {
                if ({}.hasOwnProperty.call(updatedReview.userAppFormData, p)) {
                  delete updatedReview.userAppFormData[p].label;
                  delete updatedReview.userAppFormData[p].type;
                  delete updatedReview.userAppFormData[p].options;
                }
              }

              return updatedReview;
            });
      })
      .then((updatedReview) => {
        if (req.body.deliberation) {
          return User.findOne({'_id': updatedReview.applicant['_id']}).exec()
              .then((user) => [updatedReview, user]);
        } else {
          return [updatedReview, null];
        }
      })
      .then((result) => {
        const [updatedReview, user] = result;

        if (!user) return res.json(updatedReview);

        for (const app of user.history) {
          if (app.communityId.toString() === req.params.communityId.toString() &&
            app.formId.toString() === updatedReview.formId.toString()) {
            if (updatedReview.deliberation.recommendation === 'Approved') {
              app.status = 'accepted';
            } else if (updatedReview.deliberation.recommendation === 'Rejected') {
              app.status = 'refused';
            } else {
              app.status = 'submitted';
            }

            break;
          }
        }
        return user.save()
            .then((updatedUser) => res.json(updatedReview));
      })
      .catch((e) => next(e));
}

/*
 * Delete review reviewId in community collection communityId.
 */
function remove(req, res, next) {
  const community = req.community;

  Reviews[req.query.type ? `Senior${community.label}` : community.label]
      .findByIdAndDelete(req.params.reviewId).exec()
      .then((deletedReview) => res.json(deletedReview))
      .catch((e) => next(e));
}

/*
 * Get application review by form ID
 */
function getReviewByFormId(req, res, next) {
  const community = req.community;

  Reviews[req.query.type ? `Senior${community.label}` : community.label]
      .findOne({formId: mongoose.Types.ObjectId.createFromHexString(req.params.formId)}).exec()
      .then((review) => {
        if (review) {
          return User.populate(review, {path: 'reviewers.reviewer', select: '_id firstname lastname email'})
              .then((populatedReview) => res.json(populatedReview));
        } else {
          res.status(404).json({success: false, message: 'No application review found.'});
        }
      })
      .catch((e) => next(e));
}


module.exports = {
  loadCommunity,
  getReviewSettings,
  putReviewSettings,
  buildReviewCollection,
  rebuildReviewCollection,
  getNbAppsToReview,
  list,
  create,
  get,
  update,
  remove,
  getReviewByFormId,
};
