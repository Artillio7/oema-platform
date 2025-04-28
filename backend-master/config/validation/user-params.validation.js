'use strict';

const Joi = require('joi');
const htmlSanitize = require('./html-sanitize');
const html = Joi.extend(htmlSanitize);


module.exports = {
  /* GET /api/users?limit=val1&skip=val2&filter[id][includes]=val3&filter[id][excludes]=val4&... */
  getUsers: Joi.object({
    query: Joi.object({
      limit: Joi.number().integer().min(1),
      skip: Joi.number().integer().min(0),
      sort: Joi.string().valid('firstname', 'lastname', 'created'),
      order: Joi.number().valid(1, -1),
      filter: Joi.object({
        email: Joi.object({
          includes: Joi.string(),
          excludes: Joi.string(),
        }).or('includes', 'excludes'),
        cuid: Joi.object({
          includes: Joi.string(),
          excludes: Joi.string(),
        }).or('includes', 'excludes'),
        account: Joi.object({
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
        directoryUrl: Joi.object({
          includes: Joi.string(),
          excludes: Joi.string(),
        }).or('includes', 'excludes'),
      }),
    }),
  }),

  /* POST /api/users */
  createUser: Joi.object({
    body: Joi.object({
      email: Joi.string().email().lowercase().required(),
      password: Joi.string().required(),
      role: Joi.object({
        reviewer: Joi.number(),
        referent: Joi.number(),
        admin: Joi.number(),
      }),
    }),
  }),

  /* PUT /api/users/:userId - Update user */
  /* req.body = {any subset of all the User model attributes for Referent; remove sensitive fields for user} */
  /* PUT /api/users/:userId?community=Software&role=Reviewer(| Referent) to update a user as reviewer or referent */
  updateUser: Joi.object({
    body: Joi.object({
      email: Joi.string().email().lowercase(),
      password: Joi.string().regex(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[!"#$%&'()*+.\/:;<=>?@\[\\\]^_`{|}~-]).{8,}$/),
      cuid: Joi.string().regex(/^[a-z]{4}[0-9]{4}$/),
      role: Joi.string().valid('applicant', 'reviewer', 'referent', 'other-senior-referent', 'not-referent'),
      account: Joi.string().valid('pending', 'active', 'inactive', 'suspended'),
      photo: Joi.string().regex(/.*\-profile-photo$/),
      firstname: html.string().sanitize(),
      lastname: html.string().sanitize(),
      gender: Joi.string().valid('Male', 'Female'),
      birthday: Joi.string().regex(/^(?:(?:31(\/|-|\.)(?:0?[13578]|1[02]))\1|(?:(?:29|30)(\/|-|\.)(?:0?[1,3-9]|1[0-2])\2))(?:(?:1[6-9]|[2-9]\d)?\d{2})$|^(?:29(\/|-|\.)0?2\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:0?[1-9]|1\d|2[0-8])(\/|-|\.)(?:(?:0?[1-9])|(?:1[0-2]))\4(?:(?:1[6-9]|[2-9]\d)?\d{2})$/),
      phone: html.string().regex(/^(?:(?:\(?(?:00|\+)([1-4]\d\d|[1-9]\d?)\)?)?[\-\.\ \\\/]?)?((?:\(?\d{1,}\)?[\-\.\ \\\/]?){0,})(?:[\-\.\ \\\/]?(?:#)[\-\.\ \\\/]?(\d+))?$/),
      classification: html.string().sanitize(),
      entity: html.string().sanitize(),
      location: html.string().sanitize(),
      country: html.string().sanitize(),
      managerFirstname: html.string().sanitize(),
      managerLastname: html.string().sanitize(),
      managerEmail: Joi.string().email(),
      hrFirstame: html.string().sanitize(),
      hrLastame: html.string().sanitize(),
      hrEmail: Joi.string().email(),
      directoryUrl: Joi.string().uri(),
      community: Joi.number(),
      acceptPolicy: Joi.boolean(),
      history: Joi.any().optional(),
    }).or('email', 'password', 'cuid', 'role', 'account', 'photo', 'lastname', 'firstname', 'gender', 'birthday', 'phone',
        'classification', 'entity', 'location', 'country', 'managerFirstname', 'managerLastname', 'managerEmail',
        'hrFirstname', 'hrLastname', 'hrEmail', 'directoryUrl', 'community', 'acceptPolicy', 'history'),
    params: Joi.object({
      userId: Joi.string().hex().required(),
    }),
    query: Joi.object({
      community: Joi.string().optional(),
      group: Joi.string().optional(),
      type: Joi.string().valid('senior'), // used to update a user as a reviewer for the Senior Expert programme
    }),
  }),

  /* PUT /api/users?ids=1224456,13456232,5657568768&community=Software */
  /* req.body = {any subset of all the User model attributes for Referent; remove sensitive fields for user} */
  updateUsers: Joi.object({
    body: Joi.object({
      email: Joi.string().email().lowercase(),
      password: Joi.string().regex(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[!"#$%&'()*+.\/:;<=>?@\[\\\]^_`{|}~-]).{8,}$/),
      cuid: Joi.string().regex(/^[a-z]{4}[0-9]{4}$/),
      role: Joi.string().valid('applicant', 'reviewer', 'referent', 'not-referent'),
      account: Joi.string().valid('pending', 'active', 'inactive', 'suspended'),
      firstname: html.string().sanitize(),
      lastname: html.string().sanitize(),
      gender: Joi.string().valid('Male', 'Female'),
      birthday: Joi.string().regex(/^(?:(?:31(\/|-|\.)(?:0?[13578]|1[02]))\1|(?:(?:29|30)(\/|-|\.)(?:0?[1,3-9]|1[0-2])\2))(?:(?:1[6-9]|[2-9]\d)?\d{2})$|^(?:29(\/|-|\.)0?2\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:0?[1-9]|1\d|2[0-8])(\/|-|\.)(?:(?:0?[1-9])|(?:1[0-2]))\4(?:(?:1[6-9]|[2-9]\d)?\d{2})$/),
      phone: html.string().regex(/^(?:(?:\(?(?:00|\+)([1-4]\d\d|[1-9]\d?)\)?)?[\-\.\ \\\/]?)?((?:\(?\d{1,}\)?[\-\.\ \\\/]?){0,})(?:[\-\.\ \\\/]?(?:#)[\-\.\ \\\/]?(\d+))?$/),
      classification: html.string().sanitize(),
      entity: html.string().sanitize(),
      location: html.string().sanitize(),
      country: html.string().sanitize(),
      managerFirstname: html.string().sanitize(),
      managerLastname: html.string().sanitize(),
      managerEmail: Joi.string().email(),
      hrFirstame: html.string().sanitize(),
      hrLastame: html.string().sanitize(),
      hrEmail: Joi.string().email(),
      directoryUrl: Joi.string().uri(),
      community: Joi.number(),
      history: Joi.any().optional(),
    }).or('email', 'password', 'cuid', 'role', 'account', 'lastname', 'firstname', 'gender', 'birthday', 'phone', 'classification', 'entity', 'location',
        'country', 'managerFirstname', 'managerLastname', 'managerEmail', 'hrFirstname', 'hrLastname', 'hrEmail', 'directoryUrl', 'community', 'history'),
    query: Joi.object({
      community: Joi.string().optional(),
      ids: Joi.string().required(),
      group: Joi.string().optional(),
      type: Joi.string().valid('senior'), // used to update users as reviewers for the Senior Expert programme
    }),
  }),

  /* DELETE /api/users?ids=1224456,13456232,5657568768 */
  removeUsers: Joi.object({
    query: Joi.object({
      ids: Joi.string().required(),
    }),
  }),

  /* POST /api/users/:userId/history */
  createNewUserApplication: Joi.object({
    body: Joi.object({
      community: Joi.string().required(),
      communityId: Joi.string().hex(),
      formType: Joi.string().valid('new', 'renew', 'new-senior', 'renew-senior').required(),
    }),
    params: Joi.object({
      userId: Joi.string().hex().required(),
    }),
    query: Joi.object({
      type: Joi.string().valid('senior'),
    }),
  }),

  /* PUT /api/users/:userId/history?community=communityId */
  updateLastUserApplicationWithCommunityId: Joi.object({
    body: Joi.object({
      community: Joi.string(),
      communityId: Joi.string().hex(),
      formType: Joi.string().valid('new', 'renew', 'new-senior', 'renew-senior'),
      status: Joi.string(),
      info: Joi.string(),
      formId: Joi.string().hex(),
    }).or('community', 'communityId', 'formType', 'status', 'info', 'formId'),
    params: Joi.object({
      userId: Joi.string().hex().required(),
    }),
    query: Joi.object({
      community: Joi.string().hex(),
      type: Joi.string().valid('senior'),
    }),
  }),
};
