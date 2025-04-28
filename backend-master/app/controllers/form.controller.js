'use strict';

const nodemailer = require('nodemailer');
const httpStatus = require('http-status');
const moment = require('moment');
const APIError = require('../helpers/APIError');

const config = require('../../config/config');
const Forms = require('../models/form'); // !!! one collection per community
const Community = require('../models/community');
const User = require('../models/user');

const generatePdf = require('../helpers/pdf.generator');
const JWT = require('../helpers/jwt.service');
const uploadCtrl = require('./upload.controller');


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
 * Preview submitted applications as Excel for the community req.params.communityId.
 */
async function previewApplicationsExcel(req, res, next) {
  const communities = req.communities || [req.community];
  const results = [];

  try {
    for (const community of communities) {
      const forms = await Forms[req.query.type ? `Senior${community.label}` : community.label].aggregate([
        {
          $match: !req.query.submitted ? {year: {$eq: parseInt(req.query.year) || 1 + new Date().getFullYear()}} :
            {year: {$eq: parseInt(req.query.year) || 1 + new Date().getFullYear()}, submittedAt: {$ne: null}},

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
            '_id': 0, 'email': 1, 'formType': 1, 'year': 1, 'userAnsweredForm': 1, 'submittedAt': 1, 'createdAt': 1,
            'applicant.firstname': 1, 'applicant.lastname': 1, 'applicant.gender': 1,
            'applicant.birthday': 1, 'applicant.cuid': 1, 'applicant.phone': 1,
            'applicant.entity': 1, 'applicant.location': 1, 'applicant.country': 1, 'applicant.classification': 1,
            'applicant.managerFirstname': 1, 'applicant.managerLastname': 1, 'applicant.managerEmail': 1,
            'applicant.hrFirstname': 1, 'applicant.hrLastname': 1, 'applicant.hrEmail': 1,
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

        // Build form.userAppFormData from form.formTemplate and form.userAnsweredForm,
        // then delete formTemplate and userAnsweredForm from form.
        for (const step of formTemplate) {
          if (step.form != null) {
            for (const formGrp of step.form) {
              if (formGrp.questions != null) {
                for (const question of formGrp.questions) {
                  if (question.options && question.options.preview) {
                    form.userAppFormData[question.name] = {
                      label: question.label,
                      type: question.type,
                      options: question.options,
                      answer: form.userAnsweredForm && form.userAnsweredForm[question.name] ?
                      form.userAnsweredForm[question.name] : '',
                    };
                  }
                }
              }
            }
          }
        }

        delete form.userAnsweredForm;

        form['communityId'] = community._id;
        form['communityName'] = community.name;
      }

      results.push(...forms);
    }

    res.json(results);
  } catch (e) {
    next(e);
  }
}

/*
 * List applications from the community req.params.communityId.
 */
async function list(req, res, next) {
  const communities = req.communities || [req.community];
  if (req.query.profile && req.query.year &&
    (req.query.filter || req.query.excludes || req.query.includes || req.query.limit || req.query.skip )) {
    const err = new APIError('Bad request...', httpStatus.BAD_REQUEST, true);
    next(err);
  } else if (!req.query.profile || !req.query.year) {
    // req.query only contains limit, skip, filter, or excludes/includes
    Forms[req.query.type ? `Senior${communities[0].label}` : communities[0].label].list(req.query)
        .then((forms) => res.json(forms))
        .catch((e) => next(e));
  } else { // e.g.: ?profile=1&year=2017 : list forms with user profiles, and only those submitted in the specified year
    const results = [];
    try {
      for (const community of communities) {
        const forms = await Forms[req.query.type ? `Senior${community.label}` : community.label].aggregate([
          {
            $match: !req.query.submitted ? {year: {$eq: parseInt(req.query.year) || 1 + new Date().getFullYear()}} :
                {year: {$eq: parseInt(req.query.year) || 1 + new Date().getFullYear()}, submittedAt: {$ne: null}},
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
            $project: {'_id': 1, 'email': 1, 'formType': 1, 'year': 1, 'submittedAt': 1, 'lastUpdatedAt': 1, 'createdAt': 1,
              'applicant.firstname': 1, 'applicant.lastname': 1, 'applicant.entity': 1, 'applicant.country': 1, 'applicant.directoryUrl': 1},
          },
        ]).exec();

        for (const form of forms) {
          form['communityId'] = community._id;
          form['communityName'] = community.name;
        }
        results.push(...forms);
      }
      res.json(results);
    } catch (e) {
      next(e);
    }
  }
}

/*
 * Create a new application.
 */
function create(req, res, next) {
  const community = req.community;
  const form = new Forms[req.query.type ? `Senior${community.label}` : community.label]({
    email: req.body.email,
    formType: req.body.formType,
    formTemplate: req.body.formType === 'new' ? (req.query.type ? community.newSeniorForm : community.newForm) :
      (req.query.type ? community.renewalSeniorForm : community.renewalForm),
  });

  // Create from and update user.history
  form.save()
      .then((savedForm) => {
        return User.findOne({email: savedForm.email}).exec()
            .then((user) => [savedForm, user]);
      })
      .then((result) => {
        const [savedForm, user] = result;
        user.history[user.history.length - 1].status = 'preparing';
        user.history[user.history.length - 1].formId = savedForm.id;
        return User.updateOne({'_id': user['_id']}, {$set: {history: user.history}}).exec()
            .then((raw) => [savedForm, user]);
      })
      .then((result) => res.json(result[0]))
      .catch((e) => next(e));
}

/*
 * Get user application form (without his/her profile).
 */
function get(req, res, next) {
  const community = req.community;

  Forms[req.query.type ? `Senior${community.label}` : community.label].get(req.params.formId)
      .then((form) => res.json(form))
      .catch((e) => next(e));
}

/*
 * Get user application form (with his/her profile).
 */
function getFormWizard(req, res, next) {
  const community = req.community;

  Forms[req.query.type ? `Senior${community.label}` : community.label].get(req.params.formId)
      .then((form) => {
        return User.findOne({email: form.email}).exec()
            .then((user) => res.json({user: user, form: form, community: community.name}));
      })
      .catch((e) => next(e));
}

/*
 * Update application formId in the collection of communityId.
 */
function update(req, res, next) {
  const community = req.community;

  if (req.query.submit) {
    if (!req.query.group) {
      const err = new APIError(`The query parameter group is required.`, httpStatus.BAD_REQUEST, true);
      return next(err);
    }

    const formValues = {lastUpdatedAt: new Date()};
    Object.assign(formValues, req.body);
    Forms[req.query.type ? `Senior${community.label}` : community.label]
        .findByIdAndUpdate(req.params.formId, {$set: formValues}, {new: true}).exec()
        .then((submittedForm) => {
          return User.findOne({email: submittedForm.email}).exec()
              .then((user) => [submittedForm, user]);
        })
        .then(async (result) => {
          const [submittedForm, user] = result;
          let alreadySubmittedForm = 0;

          for (const appform of user.history) {
            if (appform.communityId.toString() === req.params.communityId && appform.formId.toString() === req.params.formId &&
              appform.formType === `${submittedForm.formType}${req.query.type ? '-senior' : ''}`) {
              if (appform.status === 'submitted') {
                alreadySubmittedForm = 1;
              } else {
                submittedForm.submittedAt = submittedForm.lastUpdatedAt;
                try {
                  await submittedForm.save();
                } catch (err) {
                  throw err;
                }
                appform.submittedAt = submittedForm.lastUpdatedAt;
                appform.status = 'submitted';
              }
            }
          }

          return User.updateOne({'_id': user['_id']}, {$set: {history: user.history}}).exec()
              .then((raw) => [submittedForm, user, alreadySubmittedForm]);
        })
        .then(async (result) => {
          const [submittedForm, user, alreadySubmittedForm] = result;

          if (alreadySubmittedForm) return res.json(submittedForm);


          if (!req.query.group) {
            const err = new APIError(`The query parameter group is required.`, httpStatus.BAD_REQUEST, true);
            return next(err);
          }

          // If new submitted form, send email to Referent

          // Create pdf of the user application form
          const token = JWT.createTokenFromEmail(req.session.user.email, '20m');
          const formUrl = (config.env === 'development' ? config.frontBaseurl : config.baseURL.replace('backend', 'frontend') + ':4200') +
            `/${req.query.group}/application/thephantomroute/${token}/${req.params.formId}/${req.params.communityId}/` +
            `${submittedForm.formType}${req.query.type ? '-senior' : ''}`;

          let pdf;
          try {
            pdf = await generatePdf(formUrl);
          } catch (e) {
            console.error(e);
            pdf = null;
          }

          const smtpTransporter = nodemailer.createTransport(config.smtp);

          const formTypeText = submittedForm.formType === 'new' ?
            (req.query.type ? 'new Senior' : 'new') :
            (req.query.type ? 'renewal Senior' : 'renewal');

          let referentMail;
          if (req.query.type) {
            const referent = await User.findOne({'role.referent': {$bitsAllSet: config['senior-orange-experts-flag']}}).exec();
            referentMail = referent?.email ?? config['senior-orange-experts'].adminMail;
          } else {
            referentMail = community.referentMail;
          }

          let mailFrom = config.mail.from;
          if (req.query.group === 'security-school') {
            mailFrom = config[req.query.group].adminMail;
          }

          const appUrl = `${config.frontBaseurl}/${req.query.group}/application/appform` +
            `/${req.params.formId}/${req.params.communityId}/${submittedForm.formType}${req.query.type ? '-senior' : ''}`;

          const mailOptions = {
            to: user.email,
            cc: req.query.type ? [community.referentMail, referentMail, config[req.query.group].adminMail] :
              [community.referentMail, config[req.query.group].adminMail],
            replyTo: referentMail,
            from: mailFrom,
            subject: `${config[req.query.group].submittedAppMailTitle} ${community.name}`,
            text: `Hello ${user.firstname},\n\nYou have successfully submitted a \
${formTypeText} application \
for the community ${community.name}:\n\n \
Name: ${user.firstname} ${user.lastname} (${user.cuid})\n \
Email: ${submittedForm.email}\n \
Entity: ${user.entity}\n \
Location: ${user.location} - ${user.country}\n \
URL of your application: ${appUrl}\n \
You can still modify your application by the end of recruitment period.\n \
${pdf ? 'Your application is also attached as a PDF file to this mail.\n\n' : '\n'} \
${req.query.group.endsWith('orange-experts') ? `We will provide you with an answer by January ${1 + new Date().getFullYear()}.` : ''}\n`,
            html: `<p>Hello ${user.firstname},</p><br /> \
          <p>You have successfully submitted a ${formTypeText} \
          application for the community ${community.name}:</p> \
          <p>Name: ${user.firstname} ${user.lastname} (${user.cuid})</p> \
          <p>Email: ${submittedForm.email}</p> \
          <p>Entity: ${user.entity}</p> \
          <p>Location: ${user.location} - ${user.country}</p> \
          <p><a href="${appUrl}"> \
          Click here to review your application.</a> You can still modify it by the end of recruitment period.</p> \
          <p>Your application is also attached as a PDF file to this mail.</p> \
          <p>${req.query.group.endsWith('orange-experts') ? `We will provide you with an answer by January ${1 + new Date().getFullYear()}.` : ''}</p>`,
            attachments: pdf ? [
              { // define custom content type for the attachment
                filename: `app-form-${user.firstname}-${user.lastname}-${community.name.replace(' ', '-')}.pdf`,
                content: pdf,
                contentType: 'application/pdf',
              },
            ] : undefined,
          };
          smtpTransporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              const err = new APIError('Your application has been submitted successfully, but something is wrong, we cannot ' +
                'send an email to the community referent for notifying your submission.', httpStatus.INTERNAL_SERVER_ERROR, true);
              return next(err);
            }

            res.json(submittedForm);
          });
        })
        .catch((e) => next(e));
  } else { // not a final submission of the form
    const formValues = req.body;
    formValues['lastUpdatedAt'] = new Date();

    Forms[req.query.type ? `Senior${community.label}` : community.label]
        .findByIdAndUpdate(req.params.formId, {$set: formValues}, {new: true}).exec()
        .then((updatedForm) => res.json(updatedForm))
        .catch((e) => next(e));
  }
}

/*
 * Delete appliation formId in community collection communityId.
 */
function remove(req, res, next) {
  const community = req.community;

  Forms[req.query.type ? `Senior${community.label}` : community.label].findByIdAndDelete(req.params.formId).exec()
      .then((deletedForm) => {
        // delete user-uploaded files
        if (deletedForm.userAnsweredForm) {
          for (const key in deletedForm.userAnsweredForm) {
            if ({}.hasOwnProperty.call(deletedForm.userAnsweredForm, key)) {
              if (key.startsWith('file-')) {
                uploadCtrl.removeFileFromGridFS((req.query.type ? 'Senior-' : '') +
                  community.id.toString() + '-' + deletedForm.id.toString() + '-' + deletedForm.userAnsweredForm[key]);
              }
              if (key === 'other-documents-upload' || key.startsWith('dropzone-')) {
                for (const storedFile of deletedForm.userAnsweredForm[key]) {
                  uploadCtrl.removeFileFromGridFS((req.query.type ? 'Senior-' : '') +
                    community.id.toString() + '-' + deletedForm.id.toString() + '-' + storedFile.name);
                }
              }
              if (key.startsWith('aws-file')) {
                uploadCtrl.removeFileFromS3((req.query.type ? 'Senior-' : '') +
                  community.id.toString() + '-' + deletedForm.id.toString() + '-' + deletedForm.userAnsweredForm[key]);
              }
            }
          }
        }
        return User.findOne({email: deletedForm.email}).exec()
            .then((user) => [deletedForm, user]);
      })
      .then((result) => {
        const [deletedForm, user] = result;
        if (user) {
          if (req.query.type) {
            user.history = user.history.filter((item) =>
              item.formId.toString() !== req.params.formId || item.communityId.toString() !== req.params.communityId || !item.formType.endsWith('senior'));
          } else {
            user.history = user.history.filter((item) =>
              item.formId.toString() !== req.params.formId || item.communityId.toString() !== req.params.communityId || item.formType.endsWith('senior'));
          }
          return User.updateOne({'_id': user['_id']}, {$set: {history: user.history}}).exec()
              .then((raw) => [deletedForm, user]);
        } else {
          return result;
        }
      })
      .then(async (result) => {
        const [deletedForm, updatedUser] = result;
        // Notify the Referent only if form is already submitted for this year.
        if (!updatedUser || !deletedForm.submittedAt || deletedForm.year != 1 + new Date().getFullYear()) {
          return res.json(deletedForm);
        }

        if (!req.query.group) {
          const err = new APIError(`The query parameter group is required.`, httpStatus.BAD_REQUEST, true);
          return next(err);
        }

        const smtpTransporter = nodemailer.createTransport(config.smtp);

        let referentMail;
        if (req.query.type) {
          const referent = await User.findOne({'role.referent': {$bitsAllSet: config['senior-orange-experts-flag']}}).exec();
          referentMail = referent?.email ?? config['senior-orange-experts'].adminMail;
        } else {
          referentMail = community.referentMail;
        }

        let mailFrom = config.mail.from;
        if (req.query.group === 'security-school') {
          mailFrom = config[req.query.group].adminMail;
        }

        const mailOptions = {
          to: referentMail,
          cc: req.query.type ? [community.referentMail, config[req.query.group].adminMail] :
            [config[req.query.group].adminMail],
          from: mailFrom,
          subject: `${config[req.query.group].deletedAppMailTitle} ${community.name}`,
          text: `An application form for your community has been deleted:\n\n \
User: ${updatedUser.firstname} ${updatedUser.lastname} (${updatedUser.cuid})\n \
Application type: ${deletedForm.formType}\n \
Submitted on: ${moment(deletedForm.submittedAt).format('YYYY-MM-DD HH:mm:ss')}\n \
Email: ${updatedUser.email}\n \
Entity: ${updatedUser.entity}\n \
Location: ${updatedUser.location} - ${updatedUser.country}\n`,
        };
        smtpTransporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            const err = new APIError('Your form has been deleted successfully, but something is wrong, we cannot ' +
              'send an email to the community referent for notifying application removal.',
            httpStatus.INTERNAL_SERVER_ERROR, true);
            return next(err);
          }

          res.json(deletedForm);
        });
      })
      .catch((e) => next(e));
}

/*
 * Get submission stats about application forms for all communities.
 */
function getStats(req, res, next) {
  const thisYear = new Date().getFullYear() + 1;
  const yearsList = Array.from({length: thisYear - 2017}, (_, k) => 2017 + k + 1);

  Community.list({includes: {name: 1, label: 1, flag: 1}})
      .then((communities) => {
        communities = communities.filter((c) => (c.flag & config[req.query.group].communitiesGroupFlag) != 0);

        const mongoQueries = [];
        for (const community of communities) {
          community.flag = undefined;
          for (const year of yearsList) {
            mongoQueries.push(Forms[community.label].countDocuments({year}));
            mongoQueries.push(Forms[community.label].countDocuments({year, submittedAt: {$ne: null}}));
            mongoQueries.push(Forms[community.label].countDocuments({year, formType: 'new', submittedAt: {$ne: null}}));
            mongoQueries.push(Forms[community.label].countDocuments({year, formType: 'renew', submittedAt: {$ne: null}}));

            if (req.query.group === 'orange-experts') {
              mongoQueries.push(Forms[`Senior${community.label}`].countDocuments({year}));
              mongoQueries.push(Forms[`Senior${community.label}`].countDocuments({year, submittedAt: {$ne: null}}));
              mongoQueries.push(Forms[`Senior${community.label}`].countDocuments({year, formType: 'new', submittedAt: {$ne: null}}));
              mongoQueries.push(Forms[`Senior${community.label}`].countDocuments({year, formType: 'renew', submittedAt: {$ne: null}}));
            }
          }
        }

        return Promise.all(mongoQueries)
            .then((countResults) => [communities, countResults]);
      })
      .then((results) => {
        const [communities, counts] = results;

        const communityStats = [];
        const yearStats = {};

        const seniorSubmitted = {
          name: 'Senior Expert - submitted',
          series: [],
        };
        const seniorNotSubmitted = {
          name: 'Senior Expert - not submitted',
          series: [],
        };
        const yearSeniorStats = {};

        for (const community of communities) {
          const submitted = {
            name: `${community.name} - submitted`,
            series: [],
          };
          const notSubmitted = {
            name: `${community.name} - not submitted`,
            series: [],
          };

          for (const year of yearsList) {
            yearStats[year - 1] = yearStats[year - 1] || [];
            const yCommunity = {name: `${community.name}`, series: []};

            yCommunity.series.push({
              name: 'Not submitted',
              value: counts[0] - counts[1],
            });
            yCommunity.series.push({
              name: 'Submitted - New',
              value: counts[2],
            });
            yCommunity.series.push({
              name: 'Submitted - Renewal',
              value: counts[3],
            });
            yearStats[year - 1].push(yCommunity);

            notSubmitted.series.push({
              value: counts[0] - counts[1],
              name: `${year - 1}`,
            });
            submitted.series.push({
              value: counts[1],
              name: `${year - 1}`,
            });

            if (req.query.group === 'orange-experts') {
              yearSeniorStats[year - 1] = yearSeniorStats[year - 1] ||
                {
                  name: 'Senior Expert',
                  series: [{
                    name: 'Not submitted',
                    value: 0,
                  },
                  {
                    name: 'Submitted - New',
                    value: 0,
                  },
                  {
                    name: 'Submitted - Renewal',
                    value: 0,
                  },
                  ],
                };

              const sIdx = seniorSubmitted.series.findIndex((y) => y.name === `${year - 1}`);

              if (sIdx === -1) {
                seniorSubmitted.series.push({
                  value: counts[5],
                  name: `${year - 1}`,
                });

                seniorNotSubmitted.series.push({
                  value: counts[4] - counts[5],
                  name: `${year - 1}`,
                });
              } else {
                seniorSubmitted.series[sIdx].value += counts[5];
                seniorNotSubmitted.series[sIdx].value += counts[4] - counts[5];
              }

              yearSeniorStats[year - 1].series[0].value += counts[4] - counts[5];
              yearSeniorStats[year - 1].series[1].value += counts[6];
              yearSeniorStats[year - 1].series[2].value += counts[7];
            }

            counts.splice(0, req.query.group === 'orange-experts' ? 8 : 4);
          }

          communityStats.push(submitted, notSubmitted);
        }

        if (req.query.group === 'orange-experts') {
          communityStats.push(seniorSubmitted, seniorNotSubmitted);
          for (const year of yearsList) {
            yearStats[year - 1].push(yearSeniorStats[year - 1]);
          }

          communities.push({
            _id: config['senior-orange-experts-flag'].toString(),
            name: 'Senior Expert',
            label: 'SeniorOrangeExpert',
          });
        }

        res.json({
          yearStats,
          communityStats,
          communities,
        });
      })
      .catch((e) => next(e));
}

/*
 * Gets detailled statistics about application forms for a community.
 */
async function getCommunityStats(req, res, next) {
  const communities = req.communities || [req.community];

  let forms = [];

  try {
    for (const community of communities) {
      forms.push(...await Forms[req.communities ? `Senior${community.label}`: community.label].aggregate([
        {
          $match: {year: {$eq: parseInt(req.query.year) || 1 + new Date().getFullYear()}},
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
          $project: {'_id': 1, 'email': 1, 'formType': 1, 'year': 1, 'userAnsweredForm': 1, 'submittedAt': 1, 'createdAt': 1,
            'applicant.firstname': 1, 'applicant.lastname': 1, 'applicant.gender': 1, 'applicant.birthday': 1,
            'applicant.classification': 1, 'applicant.entity': 1, 'applicant.country': 1},
        },
        {
          $addFields: {
            community: community.name,
          },
        },
      ]).exec());
    }


    forms = forms.filter((f) => {
      const month = (new Date(f.createdAt)).getMonth() + 1;
      if (req.session.group === 'orange-experts') {
        return month === 8 || month === 9 || month === 10;
      } else {
        return month === 4 || month === 5 || month === 6;
      }
    });

    const stats = {};

    stats['forms'] = [];
    const created = {
      name: 'Created',
      series: [],
    };
    const submitted = {
      name: 'Submitted',
      series: [],
    };

    stats['gender'] = [];
    stats['country'] = [];
    stats['classification'] = [];
    stats['community'] = []; // for Senior Orange Expert only

    const classificationLevels = ['I.3', 'II.1', 'II.2', 'II.3', 'III.1', 'III.2', 'III.3', 'IV.1', 'IV.2', 'IV.3', 'IV.4',
      'IV.5', 'IV.6', 'A', 'B', 'C', 'D', 'E', 'F', 'G'];

    for (const form of forms) {
      const createdDate = new Date(form.createdAt);
      const createdAt = `${createdDate.getFullYear()}-${createdDate.getMonth() + 1}-${createdDate.getDate()}`;
      const cIdx = created.series.findIndex((e) => e.name === createdAt);
      if (cIdx === -1) {
        created.series.push({
          value: 1,
          name: createdAt,
        });
      } else {
        created.series[cIdx].value += 1;
      }

      const gender = form.applicant[0].gender || 'N/A';
      const gIdx = stats.gender.findIndex((e) => e.name === gender && e.ref === 'All');
      if (gIdx === -1) {
        stats.gender.push({
          name: gender,
          value: 1,
          ref: 'All',
        });
      } else {
        stats.gender[gIdx].value += 1;
      }

      const location = form.userAnsweredForm?.profile?.country || form.applicant[0].country || 'N/A';
      const lIdx = stats.country.findIndex((e) => e.name === location && e.ref === 'All');
      if (lIdx === -1) {
        stats.country.push({
          name: location,
          value: 1,
          ref: 'All',
        });
      } else {
        stats.country[lIdx].value += 1;
      }

      let classification = form.userAnsweredForm?.profile?.classification || form.applicant[0].classification || 'N/A';
      if (!classificationLevels.includes(classification)) {
        classification = 'N/A';
      }
      const fIdx = stats.classification.findIndex((e) => e.name === classification && e.ref === 'All');
      if (fIdx === -1) {
        stats.classification.push({
          name: classification,
          value: 1,
          ref: 'All',
        });
      } else {
        stats.classification[fIdx].value += 1;
      }

      const seniorCommunity = form.community;
      const scIdx = stats.community.findIndex((e) => e.name === seniorCommunity && e.ref === 'All');
      if (scIdx === -1) {
        stats.community.push({
          name: seniorCommunity,
          value: 1,
          ref: 'All',
        });
      } else {
        stats.community[scIdx].value += 1;
      }

      let formState = 'Not submitted';

      if (form.submittedAt) {
        const submittedDate = new Date(form.submittedAt);
        const submittedAt = `${submittedDate.getFullYear()}-${submittedDate.getMonth() + 1}-${submittedDate.getDate()}`;
        const sIdx = submitted.series.findIndex((e) => e.name === submittedAt);
        if (sIdx === -1) {
          submitted.series.push({
            value: 1,
            name: submittedAt,
          });
        } else {
          submitted.series[sIdx].value += 1;
        }

        formState = 'Submitted';
      }

      const sgIdx = stats.gender.findIndex((e) => e.name === gender && e.ref === formState);
      if (sgIdx === -1) {
        stats.gender.push({
          name: gender,
          value: 1,
          ref: formState,
        });
      } else {
        stats.gender[sgIdx].value += 1;
      }

      const slIdx = stats.country.findIndex((e) => e.name === location && e.ref === formState);
      if (slIdx === -1) {
        stats.country.push({
          name: location,
          value: 1,
          ref: formState,
        });
      } else {
        stats.country[slIdx].value += 1;
      }

      const sfIdx = stats.classification.findIndex((e) => e.name === classification && e.ref === formState);
      if (sfIdx === -1) {
        stats.classification.push({
          name: classification,
          value: 1,
          ref: formState,
        });
      } else {
        stats.classification[sfIdx].value += 1;
      }

      const sscIdx = stats.community.findIndex((e) => e.name === seniorCommunity && e.ref === formState);
      if (sscIdx === -1) {
        stats.community.push({
          name: seniorCommunity,
          value: 1,
          ref: formState,
        });
      } else {
        stats.community[sscIdx].value += 1;
      }
    }

    stats['forms'].push(created, submitted);

    res.json(stats);
  } catch (e) {
    next(e);
  }
}


module.exports = {loadCommunity, previewApplicationsExcel, list, create, get, getFormWizard, update, remove, getStats, getCommunityStats};
