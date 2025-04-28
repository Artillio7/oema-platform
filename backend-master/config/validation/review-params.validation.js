'use strict';

const Joi = require('joi');


module.exports = {
  /* GET /api/reviews/community/:communityId/settings */
  getReviewSettings: Joi.object({
    params: Joi.object({
      communityId: Joi.string().hex().required(),
    }),
  }),

  /* PUT /api/reviews/community/:communityId/settings */
  putReviewSettings: Joi.object({
    body: Joi.object({
      startReviewing: Joi.number().valid(0, 1),
      canAssignReviewers: Joi.number().valid(0, 1),
      lockReviewers: Joi.number().valid(0, 1),
      visibleReviews: Joi.number().valid(0, 1),
      hiddenColumnsFromReviewers: Joi.string().allow(''),
    }).min(1),
    params: Joi.object({
      communityId: Joi.string().hex().required(),
    }),
  }),

  /* GET /api/reviews/community/:communityId/populate */
  buildReviewCollection: Joi.object({
    params: Joi.object({
      communityId: Joi.string().hex().required(),
    }),
    query: Joi.object({
      type: Joi.string().valid('senior'),
    }),
  }),

  /* GET /api/reviews/community/:communityId/repopulate */
  rebuildReviewCollection: Joi.object({
    params: Joi.object({
      communityId: Joi.string().hex().required(),
    }),
    query: Joi.object({
      type: Joi.string().valid('senior'),
    }),
  }),

  /* GET /api/reviews/count */
  getNbAppsToReview: Joi.object({
    params: Joi.object({
      communityId: Joi.string().required(),
    }),
  }),

  /*
   * GET /api/reviews/community/:communityId \
   * ?limit=val1&skip=val2&filter[id][includes]=val3&filter[id][excludes]=val4&excludes[id]=1...
   */
  getReviews: Joi.object({
    query: Joi.object({
      limit: Joi.number().integer().min(1),
      skip: Joi.number().integer().min(0),
      filter: Joi.object({
        applicant: Joi.object({
          email: Joi.object({
            includes: Joi.string(),
            excludes: Joi.string(),
          }).or('includes', 'excludes'),
          cuid: Joi.object({
            includes: Joi.string(),
            excludes: Joi.string(),
          }).or('includes', 'excludes'),
          role: Joi.object({
            includes: Joi.string(),
            excludes: Joi.string(),
          }).or('includes', 'excludes'),
          firstname: Joi.object({
            includes: Joi.string(),
            excludes: Joi.string(),
          }).or('includes', 'excludes'),
          lastname: Joi.object({
            includes: Joi.string(),
            excludes: Joi.string(),
          }).or('includes', 'excludes'),
          gender: Joi.object({
            includes: Joi.string(),
            excludes: Joi.string(),
          }).or('includes', 'excludes'),
          classification: Joi.object({
            includes: Joi.string(),
            excludes: Joi.string(),
          }).or('includes', 'excludes'),
          entity: Joi.object({
            includes: Joi.string(),
            excludes: Joi.string(),
          }).or('includes', 'excludes'),
          location: Joi.object({
            includes: Joi.string(),
            excludes: Joi.string(),
          }).or('includes', 'excludes'),
          country: Joi.object({
            includes: Joi.string(),
            excludes: Joi.string(),
          }).or('includes', 'excludes'),
          managerFirstname: Joi.object({
            includes: Joi.string(),
            excludes: Joi.string(),
          }).or('includes', 'excludes'),
          managerLastname: Joi.object({
            includes: Joi.string(),
            excludes: Joi.string(),
          }).or('includes', 'excludes'),
          managerEmail: Joi.object({
            includes: Joi.string(),
            excludes: Joi.string(),
          }).or('includes', 'excludes'),
          hrFirstname: Joi.object({
            includes: Joi.string(),
            excludes: Joi.string(),
          }).or('includes', 'excludes'),
          hrLastname: Joi.object({
            includes: Joi.string(),
            excludes: Joi.string(),
          }).or('includes', 'excludes'),
          hrEmail: Joi.object({
            includes: Joi.string(),
            excludes: Joi.string(),
          }).or('includes', 'excludes'),
          community: Joi.object({
            includes: Joi.string(),
            excludes: Joi.string(),
          }).or('includes', 'excludes'),
          status: Joi.object({
            includes: Joi.string(),
            excludes: Joi.string(),
          }).or('includes', 'excludes'),
        }),
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
        deliberation: Joi.object({
          status: Joi.object({
            includes: Joi.string(),
            excludes: Joi.string(),
          }).or('includes', 'excludes'),
          recommendation: Joi.object({
            includes: Joi.string(),
            excludes: Joi.string(),
          }).or('includes', 'excludes'),
        }),
        notification: Joi.object({
          includes: Joi.string(),
          excludes: Joi.string(),
        }).or('includes', 'excludes'),
      }),
      excludes: Joi.object({
        'applicant': Joi.number().valid(1),
        'applicant.cuid': Joi.number().valid(1),
        'applicant.gender': Joi.number().valid(1),
        'applicant.birthday': Joi.number().valid(1),
        'applicant.phone': Joi.number().valid(1),
        'applicant.classification': Joi.number().valid(1),
        'applicant.entity': Joi.number().valid(1),
        'applicant.location': Joi.number().valid(1),
        'applicant.country': Joi.number().valid(1),
        'applicant.managerFirstname': Joi.number().valid(1),
        'applicant.managerLastname': Joi.number().valid(1),
        'applicant.managerEmail': Joi.number().valid(1),
        'applicant.hrFirstname': Joi.number().valid(1),
        'applicant.hrLastname': Joi.number().valid(1),
        'applicant.hrEmail': Joi.number().valid(1),
        'applicant.role': Joi.number().valid(1),
        'applicant.status': Joi.number().valid(1),
        'applicant.community': Joi.number().valid(1),
        'applicant.history': Joi.number().valid(1),
        'formId': Joi.number().valid(1),
        /* communityId: Joi.number().valid(1),*/
        'formType': Joi.number().valid(1),
        'year': Joi.number().valid(1),
        'userAppFormData': Joi.number().valid(1),
        'notesAboutApplicant': Joi.number().valid(1),
        'reviewers': Joi.number().valid(1),
        'rate': Joi.number().valid(1),
        'deliberation': Joi.number().valid(1),
        'notification': Joi.number().valid(1),
        'createdAt': Joi.number().valid(1),
      }),
      includes: Joi.object({
        applicant: Joi.number().valid(1),
        formId: Joi.number().valid(1),
        /* communityId: Joi.number().valid(1),*/
        formType: Joi.number().valid(1),
        year: Joi.number().valid(1),
        userAppFormData: Joi.number().valid(1),
        notesAboutApplicant: Joi.number().valid(1),
        reviewers: Joi.number().valid(1),
        rate: Joi.number().valid(1),
        deliberation: Joi.number().valid(1),
        notification: Joi.number().valid(1),
        createdAt: Joi.number().valid(1),
      }),
      template: Joi.number().valid(0, 1).optional(),
      type: Joi.string().valid('senior'),
    }).nand('excludes', 'includes'),
    params: Joi.object({
      communityId: Joi.string().hex().required(),
    }),
  }),

  /* POST /api/reviews/community/:communityId */
  createReview: Joi.object({
    params: Joi.object({
      communityId: Joi.string().hex().required(),
    }),
    query: Joi.object({
      type: Joi.string().valid('senior'),
    }),
    body: Joi.object({
      formId: Joi.string().hex().required(),
    }),
  }),

  /* GET /api/reviews/:reviewId/community/:communityId */
  getReviewById: Joi.object({
    params: Joi.object({
      reviewId: Joi.string().hex().required(),
      communityId: Joi.string().hex().required(),
    }),
    query: Joi.object({
      type: Joi.string().valid('senior'),
    }),
  }),

  /* PUT /api/reviews/:reviewId/community/:communityId */
  updateReview: Joi.object({
    body: Joi.object({
      notesAboutApplicant: Joi.string().allow(''),
      reviewer: Joi.object({
        reviewer: Joi.string().hex(),
        reviews: Joi.string().valid('', 'yes', 'no', 'maybe'),
        rating: Joi.object({rate: Joi.string().valid('', '-2', '-1', '0', '+1', '+2')}),
        comments: Joi.string().allow(''),
      }),
      deliberation: Joi.object({
        comments: Joi.string().allow(''),
        status: Joi.string().allow(''),
        recommendation: Joi.string().allow(''),
        notes: Joi.string().allow(''),
      }),
      notification: Joi.string().allow(''),
    }).or('notesAboutApplicant', 'reviewer', 'deliberation', 'notification'),
    params: Joi.object({
      reviewId: Joi.string().hex().required(),
      communityId: Joi.string().hex().required(),
    }),
    query: Joi.object({
      type: Joi.string().valid('senior'),
    }),
  }),

  /* DELETE /api/reviews/:reviewId/community/:communityId */
  deleteReview: Joi.object({
    params: Joi.object({
      reviewId: Joi.string().hex().required(),
      communityId: Joi.string().hex().required(),
    }),
    query: Joi.object({
      type: Joi.string().valid('senior'),
    }),
  }),

  /* GET /api/reviews/form/:formId/community/:communityId */
  getReviewByFormId: Joi.object({
    params: Joi.object({
      formId: Joi.string().hex().required(),
      communityId: Joi.string().hex().required(),
    }),
    query: Joi.object({
      type: Joi.string().valid('senior'),
    }),
  }),
};
