'use strict';

const Joi = require('joi');
const htmlSanitize = require('./html-sanitize');
const html = Joi.extend(htmlSanitize);


module.exports = {
  /* POST /api/contact */
  contactAdmin: Joi.object({
    body: Joi.object({
      message: html.string().sanitize().required(),
    }),
    query: Joi.object({
      group: Joi.string().optional(),
    }),
  }),

  /* POST /api/contact/users */
  contactUsers: Joi.object({
    body: Joi.object({
      recipients: Joi.array().items(Joi.string().email()).required(),
      from: Joi.string().email(),
      subject: html.string().sanitize().required(),
      message: html.string().sanitize().required(),
      ccemails: Joi.array().items(Joi.string().email()),
      bccemails: Joi.array().items(Joi.string().email()),
    }),
  }),
};
