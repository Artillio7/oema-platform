'use strict';

const Joi = require('joi');


module.exports = {
  /* GET /api/phantomjs/:token/form/:formId/community/:communityId */
  renderForm: Joi.object({
    params: Joi.object({
      token: Joi.string().required(),
      formId: Joi.string().hex().required(),
      communityId: Joi.string().hex().required(),
      formType: Joi.string().valid('new', 'renew', 'new-senior', 'renew-senior'),
    }),
  }),

  /* GET /api/phantomjs/form/:formId/community/:communityId */
  pdfFormExport: Joi.object({
    params: Joi.object({
      formId: Joi.string().hex().required(),
      communityId: Joi.string().hex().required(),
      formType: Joi.string().valid('new', 'renew', 'new-senior', 'renew-senior'),
    }),
    query: Joi.object({
      group: Joi.string().required(),
    }),
  }),
};
