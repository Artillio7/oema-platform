'use strict';

const nodemailer = require('nodemailer');
const httpStatus = require('http-status');
const APIError = require('../helpers/APIError');
const utils = require('../helpers/utils');

const config = require('../../config/config');
const Community = require('../models/community');
const User = require('../models/user');
const Forms = require('../models/form');


/*
 * Load community and append to req.
 */
function loadCommunity(req, res, next, id) {
  if (id !== config['senior-orange-experts-flag'].toString()) {
    Community.get(id)
        .then((community) => {
          req.community = community;
          next();
        })
        .catch((e) => next(e));
  } else {
    Community.find({flag: {$bitsAnySet: config['orange-experts'].communitiesGroupFlag}}).exec()
        .then((communities) => {
          req.communities = communities;
          next();
        })
        .catch((e) => next(e));
  }
}

/*
 * Get the list of communities.
 * Filtering communities is possible with the query parameter `filter`:
 * GET /api/communities?filter[id][includes]=val3&filter[id][excludes]=val4&excludes[id]=1...
 */
function list(req, res, next) {
  if (!req.query.name || !req.query.reviewers) {
    Community.list(req.query)
        .then((communities) => {
          // Just check whether newForm, renewalForm, etc. exist...
          if (req.query.forms) {
            for (const community of communities) {
              if (community.newForm) {
                if (community.newForm.length > 0) {
                  community.newForm = [];
                } else {
                  community.newForm = undefined;
                }
              }

              if (community.renewalForm) {
                if (community.renewalForm.length > 0 && community.renewalForm[1].form.length > 0) {
                  community.renewalForm = [];
                } else {
                  community.renewalForm = undefined;
                }
              }

              if (community.newFormBackup) {
                if (community.newFormBackup.length > 0) {
                  community.newFormBackup = [];
                } else {
                  community.newFormBackup = undefined;
                }
              }

              if (community.renewalFormBackup) {
                if (community.renewalFormBackup.length > 0) {
                  community.renewalFormBackup = [];
                } else {
                  community.renewalFormBackup = undefined;
                }
              }

              if (community.newFormDraft) {
                if (community.newFormDraft.length > 0) {
                  community.newFormDraft = [];
                } else {
                  community.newFormDraft = undefined;
                }
              }

              if (community.renewalFormDraft) {
                if (community.renewalFormDraft.length > 0) {
                  community.renewalFormDraft = [];
                } else {
                  community.renewalFormDraft = undefined;
                }
              }

              if (community.newSeniorForm) {
                if (community.newSeniorForm.length > 0) {
                  community.newSeniorForm = [];
                } else {
                  community.newSeniorForm = undefined;
                }
              }

              if (community.renewalSeniorForm) {
                if (community.renewalSeniorForm.length > 0) {
                  community.renewalSeniorForm = [];
                } else {
                  community.renewalSeniorForm = undefined;
                }
              }

              if (community.newSeniorFormBackup) {
                if (community.newSeniorFormBackup.length > 0) {
                  community.newSeniorFormBackup = [];
                } else {
                  community.newSeniorFormBackup = undefined;
                }
              }

              if (community.renewalSeniorFormBackup) {
                if (community.renewalSeniorFormBackup.length > 0) {
                  community.renewalSeniorFormBackup = [];
                } else {
                  community.renewalSeniorFormBackup = undefined;
                }
              }

              if (community.newSeniorFormDraft) {
                if (community.newSeniorFormDraft.length > 0) {
                  community.newSeniorFormDraft = [];
                } else {
                  community.newSeniorFormDraft = undefined;
                }
              }

              if (community.renewalSeniorFormDraft) {
                if (community.renewalSeniorFormDraft.length > 0) {
                  community.renewalSeniorFormDraft = [];
                } else {
                  community.renewalSeniorFormDraft = undefined;
                }
              }
            }
          }

          if (req.query.group) {
            res.json(communities.filter((c) => (c.flag & config[req.query.group].communitiesGroupFlag) != 0));
          } else {
            res.json(communities);
          }
        })
        .catch((e) => next(e));
  } else {
    // List reviewers by community name
    if (req.query.type) {
      Community.findOne({
        flag: 1,
      }).populate('seniorReviewers').exec()
          .then((community) => res.json(community.seniorReviewers))
          .catch((e) => next(e));
    } else {
      Community.findOne({
        name: decodeURIComponent(req.query.name),
      }).populate('reviewers').exec()
          .then((community) => res.json(community.reviewers))
          .catch((e) => next(e));
    }
  }
}

/*
 * Create a new community
 */
function create(req, res, next) {
  const community = new Community(req.body);

  community.save()
      .then((savedCommunity) => res.json(savedCommunity))
      .catch((e) => next(e));
}

/*
 * Get community by communityId
 */
function get(req, res) {
  const communities = req.communities || [req.community];

  const community = Object.assign(communities[0],
      {
        _id: req.params.communityId === config['senior-orange-experts-flag'].toString() ?
          config['senior-orange-experts-flag'].toString() : communities[0]['_id'],
        name: req.params.communityId === config['senior-orange-experts-flag'].toString() ? config['senior-orange-experts'].communityName : communities[0].name,
        referentName: undefined,
        referentMail: undefined,
        label: undefined,
      });

  return res.json(community);
}

/*
 * Update existing community.
 */
async function update(req, res, next) {
  if (!req.body.newFormDraft && !req.body.renewalFormDraft && !req.body.newFormBackup && !req.body.renewalFormBackup &&
    !req.body.newSeniorFormDraft && !req.body.renewalSeniorFormDraft && !req.body.newSeniorFormBackup && !req.body.renewalSeniorFormBackup) {
    Community.findByIdAndUpdate(req.params.communityId, {$set: req.body}, {new: true}).exec()
        .then((updatedCommunity) => res.json(updatedCommunity))
        .catch((e) => next(e));
  } else if ((!req.body.notifyUsers && Object.keys(req.body).length > 1) || (req.body.notifyUsers && Object.keys(req.body).length !== 2)) {
    const err = new APIError('Bad request...', httpStatus.BAD_REQUEST, true);
    next(err);
  } else {
    let sendNotifMailUsers = false;

    const communities = req.communities || [req.community];

    const newForm = req.query.type ? 'newSeniorForm' : 'newForm';
    const renewalForm = req.query.type ? 'renewalSeniorForm' : 'renewalForm';
    const newFormBackup = req.query.type ? 'newSeniorFormBackup' : 'newFormBackup';
    const renewalFormBackup = req.query.type ? 'renewalSeniorFormBackup' : 'renewalFormBackup';
    const newFormDraft = req.query.type ? 'newSeniorFormDraft' : 'newFormDraft';
    const renewalFormDraft = req.query.type ? 'renewalSeniorFormDraft' : 'renewalFormDraft';


    if (req.body.newFormDraft) {
      const modifType = req.body.newFormDraft;
      if (typeof modifType === 'string') {
        switch (modifType) {
          case 'copy':
            for (const community of communities) {
              community[newFormDraft] = community[newForm];
            }
            break;
          case 'canvas':
            for (const community of communities) {
              community[newFormDraft] = utils.applicationFormTemplate;
            }
            break;
          case 'previous':
            for (const community of communities) {
              if (community[newFormBackup] && community[newFormBackup].length > 0) {
                community[newFormDraft] = community[newFormBackup];
              }
            }
            break;
          case 'publish':
            for (const community of communities) {
              community[newFormBackup] = community[newForm];
              community[newForm] = community[newFormDraft];
              for (let i = 0; i < community[newForm].length; i++) {
                community[newForm][i].active = i === 0 ? true : false;
                community[newForm][i].valid = false;
                community[newForm][i].hasError = false;
              }
              community[newFormDraft] = [];
            }
            if (req.body.notifyUsers) {
              sendNotifMailUsers = true;
            }
            break;
          case 'delete':
            for (const community of communities) {
              community[newFormDraft] = [];
            }
            break;
        }
      } else {
        for (const community of communities) {
          community[newFormDraft] = req.body.newFormDraft;
        }
      }
    } else if (req.body.renewalFormDraft) {
      const modifType = req.body.renewalFormDraft;
      if (typeof modifType === 'string') {
        switch (modifType) {
          case 'copy':
            for (const community of communities) {
              community[renewalFormDraft] = community[renewalForm];
            }
            break;
          case 'new':
            for (const community of communities) {
              community[renewalFormDraft] = community[newForm];
              const renewalFormDraftJSON = JSON.stringify(community[renewalFormDraft]);
              community[renewalFormDraft] = JSON.parse(renewalFormDraftJSON.replace('MR-new', 'MR-renew'));
            }
            break;
          case 'canvas':
            for (const community of communities) {
              community[renewalFormDraft] = utils.applicationFormTemplate;
            }
            break;
          case 'previous':
            for (const community of communities) {
              if (community[renewalFormBackup] && community[renewalFormBackup].length > 0) {
                community[renewalFormDraft] = community[renewalFormBackup];
              }
            }
            break;
          case 'publish':
            for (const community of communities) {
              community[renewalFormBackup] = community[renewalForm];
              community[renewalForm] = community[renewalFormDraft];
              for (let i = 0; i < community[renewalForm].length; i++) {
                community[renewalForm][i].active = i === 0 ? true : false;
                community[renewalForm][i].valid = false;
                community[renewalForm][i].hasError = false;
              }
              community[renewalFormDraft] = [];
            }
            if (req.body.notifyUsers) {
              sendNotifMailUsers = true;
            }
            break;
          case 'delete':
            for (const community of communities) {
              community[renewalFormDraft] = [];
            }
            break;
        }
      } else {
        for (const community of communities) {
          community[renewalFormDraft] = req.body.renewalFormDraft;
        }
      }
    } else if (req.body.newFormBackup !== undefined) {
      for (const community of communities) {
        if (req.body.newFormBackup === 1 && community[newFormBackup] && community[newFormBackup].length > 0) {
          community[newForm] = community[newFormBackup];
        } else if (req.body.newFormBackup === 0) {
          delete community[newFormBackup];
        }
      }
    } else if (req.body.renewalFormBackup !== undefined) {
      for (const community of communities) {
        if (req.body.renewalFormBackup === 1 && community[renewalFormBackup] && community[renewalFormBackup].length > 0) {
          community[renewalForm] = community[renewalFormBackup];
        } else if (req.body.renewalFormBackup === 0) {
          delete community[renewalFormBackup];
        }
      }
    }

    try {
      if (sendNotifMailUsers) {
        const userMails = [];
        for (const community of communities) {
          await community.save();
          const forms = await Forms[req.query.type ? `Senior${community.label}` : community.label].find({year: {$eq: 1 + new Date().getFullYear()}}).exec();
          userMails.push(...forms.map((f) => f.email));
        }

        const smtpTransporter = nodemailer.createTransport(config.smtp);
        let referentMail;
        if (req.query.type) {
          const referent = await User.findOne({'role.referent': {$bitsAllSet: config['senior-orange-experts-flag']}}).exec();
          referentMail = referent?.email ?? config['senior-orange-experts'].adminMail;
        } else {
          referentMail = communities[0].referentMail;
        }

        let mailFrom = config.mail.from;
        if (req.query.group === 'security-school') {
          mailFrom = config[req.query.group].adminMail;
        }

        const mailOptions = {
          to: userMails,
          replyTo: referentMail,
          from: mailFrom,
          subject: req.query.type ? config['senior-orange-experts'].name : communities[0].name + ': application form updated!',
          text: req.body.notifyUsers,
        };

        smtpTransporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            const err = new APIError('The application form template has been published successfully, ' +
                'but an unknown error prevented from sending a notification email to users.',
            httpStatus.INTERNAL_SERVER_ERROR, true);
            return next(err);
          }

          res.json({success: true, message: 'Successfully published the template with an email sent to users.'});
        });
      } else {
        for (const community of communities) {
          await community.save();
        }

        res.json(communities[0]);
      }
    } catch (err) {
      next(err);
    }
  }
}

/*
 * Delete a community.
 */
function remove(req, res, next) {
  Community.findByIdAndDelete(req.params.communityId)
      .then((deletedCommunity) => res.json(deletedCommunity))
      .catch((e) => next(e));
}

/*
 * List reviewers of the community with communityId.
 */
function listReviewersByCommunityId(req, res, next) {
  const community = req.query.type ? req.communities[0] : req.community;

  User.find({
    '_id': {$in: req.query.type ? community.seniorReviewers : community.reviewers},
  }).exec()
      .then((users) => res.json(users))
      .catch((e) => next(e));
}

/*
 * List referents of the community with communityId.
 */
async function listReferentsByCommunityId(req, res, next) {
  if (req.params.communityId !== config['senior-orange-experts-flag'].toString()) {
    const community = req.community;

    User.find({
      'role.referent': {$bitsAllSet: community.flag},
    }).exec()
        .then((users) => res.json(users))
        .catch((e) => next(e));
  } else {
    try {
      const users = [];
      for (const community of req.communities) {
        users.push(...await User.find({
          'role.referent': {$bitsAllSet: community.flag},
        }).exec());
      }

      const seniorReferents = await User.find({
        'role.referent': {$bitsAllSet: config['senior-referent-reviewer-role-flag']},
      }).exec();

      for (const ref of seniorReferents) {
        if (users.findIndex((u) => u.email === ref.email) === -1) {
          users.push(ref);
        } else {
          // remove useless role
          ref.role = Object.assign(ref.role, {referent: ref.role.referent & ~config['senior-orange-experts-flag']});
          await ref.save();
        }
      }

      res.json(users);
    } catch (e) {
      next(e);
    }
  }
}


module.exports = {loadCommunity, list, create, get, update, remove, listReviewersByCommunityId, listReferentsByCommunityId};
