'use strict';

const generatePdf = require('../helpers/pdf.generator');

const JWT = require('../helpers/jwt.service');

const config = require('../../config/config');
const Forms = require('../models/form');
const Community = require('../models/community');
const User = require('../models/user');


function renderForm(req, res, next) {
  const token = req.params.token;
  JWT.verifyToken(token, (error, decodedToken) => {
    if (error) {
      return res.status(401).json({success: false, message: `Not a valid token: ${error.message}.`});
    }

    Community.get(req.params.communityId)
        .then((community) => {
          return Forms[req.params.formType && req.params.formType.endsWith('senior') ? `Senior${community.label}` : community.label]
              .get(req.params.formId)
              .then((form) => [community, form]);
        })
        .then((result) => {
          const [community, form] = result;
          return User.findOne({email: form.email}).exec()
              .then((user) => res.json({user: user, form: form, community: community.name}));
        })
        .catch((e) => next(e));
  });
}


function pdfFormExport(req, res, next) {
  const token = JWT.createTokenFromEmail(req.session.user.email, '20m');
  const url = (config.env === 'development' ? config.frontBaseurl : config.baseURL.replace('backend', 'frontend') + ':4200') +
    `/${req.query.group}/application/thephantomroute/${token}/${req.params.formId}/${req.params.communityId}/${req.params.formType || ''}`;

  generatePdf(url).then((pdf) => {
    res.contentType('application/pdf');
    res.send(pdf);
  })
      .catch((e) => next(e));
}


module.exports = {renderForm, pdfFormExport};
