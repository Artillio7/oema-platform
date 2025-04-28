'use strict';

const Joi = require('joi');


module.exports = {
  /* GET /api/formwizards/:communityId?type={new,renew} */
  getFormWizard: Joi.object({
    query: Joi.object({
      type: Joi.string().valid('new', 'renew', 'new-senior', 'renew-senior').required(),
    }),
    params: Joi.object({
      communityId: Joi.string().hex().required(),
    }),
  }),
};
