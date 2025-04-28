'use strict';

const Joi = require('joi');


module.exports = {
  /* GET /api/forms/community/:communityId \
    ?limit=val1&skip=val2&filter[id][includes]=val3&filter[id][excludes]=val4&excludes[id]=1...*/
  getForms: Joi.object({
    query: Joi.object({
      profile: Joi.number().valid(1),
      year: Joi.number(),
      submitted: Joi.number().valid(1),
      limit: Joi.number().integer().min(1),
      skip: Joi.number().integer().min(0),
      filter: Joi.object({
        email: Joi.object({
          includes: Joi.string(),
          excludes: Joi.string(),
        }).or('includes', 'excludes'),
        formType: Joi.object({
          includes: Joi.string(),
          excludes: Joi.string(),
        }).or('includes', 'excludes'),
        year: Joi.alternatives().try(Joi.number(), Joi.object({
          // see here https://docs.mongodb.com/manual/reference/operator/query-comparison/
          $eq: Joi.number(),
          $gt: Joi.number(),
          $gte: Joi.number(),
          $lt: Joi.number(),
          $lte: Joi.number(),
          $ne: Joi.number(),
          $in: Joi.array().items(Joi.number()),
          $nin: Joi.array().items(Joi.number()),
        })),
      }),
      excludes: Joi.object({
        formTemplate: Joi.number().valid(1),
        userAnsweredForm: Joi.number().valid(1),
        juryDecision: Joi.number().valid(1),
      }),
      includes: Joi.object({
        email: Joi.number().valid(1),
        formType: Joi.number().valid(1),
        year: Joi.number().valid(1),
        formTemplate: Joi.number().valid(1),
        userAnsweredForm: Joi.number().valid(1),
        juryDecision: Joi.number().valid(1),
        submittedAt: Joi.number().valid(1),
        createdAt: Joi.number().valid(1),
      }),
      type: Joi.string().valid('senior'),
    })
        .nand('excludes', 'includes')
        .with('profile', 'year'),
    params: Joi.object({
      communityId: Joi.string().hex().required(),
    }),
  }),

  /* POST /api/forms/community/:communityId */
  createForm: Joi.object({
    body: Joi.object({
      email: Joi.string().email().required(),
      formType: Joi.string().valid('new', 'renew').required(),
    }),
    params: Joi.object({
      communityId: Joi.string().hex().required(),
    }),
    query: Joi.object({
      type: Joi.string().valid('senior'),
    }),
  }),

  /* GET /api/forms/community/:communityId/preview?year=2017 */
  previewApplicationsExcel: Joi.object({
    params: Joi.object({
      communityId: Joi.string().hex().required(),
    }),
    query: Joi.object({
      year: Joi.number().required(),
      submitted: Joi.number().valid(1),
      type: Joi.string().valid('senior'),
    }),
  }),

  /* GET /api/forms/:formId/community/:communityId{?id=123456} */
  getForm: Joi.object({
    query: Joi.object({
      id: Joi.string().hex(),
      type: Joi.string().valid('senior'),
    }),
    params: Joi.object({
      formId: Joi.string().hex().required(),
      communityId: Joi.string().hex().required(),
    }),
  }),

  /* PUT /api/forms/:formId/community/:communityId{?submit=true} */
  updateForm: Joi.object({
    body: Joi.object({
      email: Joi.string().email(),
      formType: Joi.string().valid('new', 'renew'),
      formTemplate: Joi.any(),
      userAnsweredForm: Joi.any(),
      juryDecision: Joi.any(),
    }).or('email', 'formType', 'formTemplate', 'userAnsweredForm', 'juryDecision'),
    query: Joi.object({
      id: Joi.string().hex().optional(),
      submit: Joi.number().valid(0, 1).optional(),
      group: Joi.string().optional(),
      type: Joi.string().valid('senior').optional(),
    }),
    params: Joi.object({
      formId: Joi.string().hex().required(),
      communityId: Joi.string().hex().required(),
    }),
  }),

  /* DELETE /api/forms/:formId/community/:communityId{?id=123456} */
  deleteForm: Joi.object({
    query: Joi.object({
      id: Joi.string().hex().optional(),
      group: Joi.string().optional(),
      type: Joi.string().valid('senior').optional(),
    }),
    params: Joi.object({
      formId: Joi.string().hex().required(),
      communityId: Joi.string().hex().required(),
    }),
  }),

  /* GET /api/forms/stats?group=orange-experts */
  getStats: Joi.object({
    query: Joi.object({
      group: Joi.string(),
    }),
  }),

  /* GET /api/forms/community/:communityId/stats?year=2022 */
  getCommunityStats: Joi.object({
    query: Joi.object({
      year: Joi.number(),
    }),
    params: Joi.object({
      communityId: Joi.string().hex().required(),
    }),
  }),
};
