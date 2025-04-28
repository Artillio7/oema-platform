'use strict';

const Joi = require('joi');
const httpStatus = require('http-status');
const APIError = require('../../app/helpers/APIError');


module.exports = (schema = {}) => {
  Joi.assert(schema, Joi.object().min(1));

  // return the validation middleware
  return (req, _, next) => {
    return schema.validateAsync(req, {stripUnknown: true})
        .then((_) => {
          next();
        })
        .catch((error) => {
          console.log(req.body);
          console.log(req.query);
          console.log(error);
          const err = new APIError('Bad request...', httpStatus.BAD_REQUEST, true);
          next(err);
        });
  };
};
