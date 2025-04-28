'use strict';

const Joi = require('joi');
const htmlSanitize = require('./html-sanitize');
const html = Joi.extend(htmlSanitize);


module.exports = {
  /* GET /api/communities?filter[id][includes]=val3&filter[id][excludes]=val4&excludes[id]=1... */
  getCommunities: Joi.object({
    query: Joi.object({
      name: Joi.string(),
      reviewers: Joi.number().valid(1),
      type: Joi.string().valid('senior'),
      group: Joi.string(),
      filter: Joi.object({
        name: Joi.object({
          includes: Joi.string(),
          excludes: Joi.string(),
        }).or('includes', 'excludes'),
        label: Joi.object({
          includes: Joi.string(),
          excludes: Joi.string(),
        }).or('includes', 'excludes'),
        flag: Joi.number(),
        referentName: Joi.object({
          includes: Joi.string(),
          excludes: Joi.string(),
        }).or('includes', 'excludes'),
        referentMail: Joi.object({
          includes: Joi.string(),
          excludes: Joi.string(),
        }).or('includes', 'excludes'),
      }),
      excludes: Joi.object({
        name: Joi.number().valid(1),
        label: Joi.number().valid(1),
        referentName: Joi.number().valid(1),
        referentMail: Joi.number().valid(1),
        reviewers: Joi.number().valid(1),
        newForm: Joi.number().valid(1),
        renewalForm: Joi.number().valid(1),
        newFormBackup: Joi.number().valid(1),
        renewalFormBackup: Joi.number().valid(1),
        newFormDraft: Joi.number().valid(1),
        renewalFormDraft: Joi.number().valid(1),

        newSeniorForm: Joi.number().valid(1),
        renewalSeniorForm: Joi.number().valid(1),
        newSeniorFormBackup: Joi.number().valid(1),
        renewalSeniorFormBackup: Joi.number().valid(1),
        newSeniorFormDraft: Joi.number().valid(1),
        renewalSeniorFormDraft: Joi.number().valid(1),

        createdAt: Joi.number().valid(1),
      }),
      includes: Joi.object({
        name: Joi.number().valid(1),
        label: Joi.number().valid(1),
        referentName: Joi.number().valid(1),
        referentMail: Joi.number().valid(1),
        reviewers: Joi.number().valid(1),
        newForm: Joi.number().valid(1),
        renewalForm: Joi.number().valid(1),
        newFormBackup: Joi.number().valid(1),
        renewalFormBackup: Joi.number().valid(1),
        newFormDraft: Joi.number().valid(1),
        renewalFormDraft: Joi.number().valid(1),

        newSeniorForm: Joi.number().valid(1),
        renewalSeniorForm: Joi.number().valid(1),
        newSeniorFormBackup: Joi.number().valid(1),
        renewalSeniorFormBackup: Joi.number().valid(1),
        newSeniorFormDraft: Joi.number().valid(1),
        renewalSeniorFormDraft: Joi.number().valid(1),

        createdAt: Joi.number().valid(1),
      }),
    }).nand('excludes', 'includes'),
  }),

  /* POST /api/communities */
  createCommunity: Joi.object({
    body: Joi.object({
      name: Joi.string().required(),
      label: Joi.string().required(),
      flag: Joi.number().required(),
      referentName: Joi.string(),
      referentMail: Joi.string().email(),
      newForm: Joi.any(),
      renewalForm: Joi.any(),
      newSeniorForm: Joi.any(),
      renewalSeniorForm: Joi.any(),
    }),
  }),

  /* PUT /api/communities/:communityId */
  updateCommunity: Joi.object({
    body: Joi.object({
      name: Joi.string(),
      label: Joi.string().forbidden(),
      referentName: Joi.string(),
      referentMail: Joi.string().email(),
      newForm: Joi.any(),
      renewalForm: Joi.any(),
      newFormDraft: Joi.alternatives(Joi.string().valid('copy', 'canvas', 'renewal', 'previous', 'publish', 'delete'), Joi.any()),
      renewalFormDraft: Joi.alternatives(Joi.string().valid('copy', 'canvas', 'new', 'previous', 'publish', 'delete'), Joi.any()),
      newFormBackup: Joi.number().valid(0, 1),
      renewalFormBackup: Joi.number().valid(0, 1),

      newSeniorForm: Joi.any(),
      renewalSeniorForm: Joi.any(),
      newSeniorFormDraft: Joi.alternatives(Joi.string().valid('copy', 'canvas', 'renewal', 'previous', 'publish', 'delete'), Joi.any()),
      renewalSeniorFormDraft: Joi.alternatives(Joi.string().valid('copy', 'canvas', 'new', 'previous', 'publish', 'delete'), Joi.any()),
      newSeniorFormBackup: Joi.number().valid(0, 1),
      renewalSeniorFormBackup: Joi.number().valid(0, 1),

      notifyUsers: html.string().sanitize(),
    }).min(1),
    params: Joi.object({
      communityId: Joi.string().hex().required(),
    }),
    query: Joi.object({
      type: Joi.string().valid('senior'),
      group: Joi.string().optional(),
    }),
  }),

  /* GET /api/communities/:community/reviewers  */
  /* GET /api/communities/:community/referents  */
  listByCommunityId: Joi.object({
    params: Joi.object({
      communityId: Joi.string().hex().required(),
    }),
    query: Joi.object({
      type: Joi.string().valid('senior'),
    }),
  }),
};
