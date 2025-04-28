'use strict';

const Joi = require('joi');
const sanitizeHtml = require('sanitize-html');


module.exports = {
  type: 'string',
  base: Joi.string(),
  rules: {
    sanitize: {
      validate(value, helpers, args, options) {
        return sanitizeHtml(value, {
          allowedTags: [],
          allowedAttributes: {},
        });
      },
    },
  },
};
