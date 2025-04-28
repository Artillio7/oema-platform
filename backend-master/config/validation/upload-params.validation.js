'use strict';

const Joi = require('joi');


module.exports = {
  /* POST /api/upload */
  createFile: Joi.object({
    files: Joi.object({
      filefield: Joi.object({
        data: Joi.any(),
        name: Joi.string(),
        encoding: Joi.string(),
        mimetype: Joi.string(),
        truncated: Joi.boolean(),
      }).required(),
    }),
  }),

  /* GET /api/upload/:filename */
  checkFilenameParam: Joi.object({
    params: Joi.object({
      filename: Joi.string().required(),
    }),
    query: Joi.object({
      exists: Joi.string().valid('1'),
    }),
  }),

  /* GET, DELETE /api/upload/:userId/:filename */
  checkUserFilenameParam: Joi.object({
    params: Joi.object({
      userId: Joi.string().required(),
      filename: Joi.string().required(),
    }),
  }),

  /* GET, DELETE /api/upload/aws?file= */
  getS3File: Joi.object({
    query: Joi.object({
      user: Joi.string().required(),
      file: Joi.string().required(),
    }),
  }),

  /* GET /api/upload/archive/community/:communityId/forms */
  formArchive: Joi.object({
    params: Joi.object({
      communityId: Joi.string().hex().required(),
    }),
    query: Joi.object({
      ids: Joi.string().required(),
      group: Joi.string().required(),
      type: Joi.string().valid('senior'),
    }),
  }),
};
