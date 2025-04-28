'use strict';

const Joi = require('joi');


module.exports = {
  /* POST /api/auth/register */
  register: Joi.object({
    body: Joi.object({
      email: Joi.string().trim().email().regex(/^((?!\.ext@).)*$/).required(),
      password: Joi.string().regex(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[!"#$%&'()*+.\/:;<=>?@\[\\\]^_`{|}~-]).{8,}$/).required(),
    }),
    query: Joi.object({
      group: Joi.string().required(),
    }),
  }),

  /* POST /api/auth/login */
  login: Joi.object({
    body: Joi.object({
      email: Joi.string().trim().email().required(),
      password: Joi.string().required(),
      keepalive: Joi.boolean(),
    }),
    query: Joi.object({
      group: Joi.string().required(),
    }),
  }),

  /* GET /api/auth/oidc/userinfo */
  getOidcUserInfo: Joi.object({
    query: Joi.object({
      group: Joi.string().required(),
    }),
  }),

  /* POST /api/auth/oidc/create */
  createOidcAccount: Joi.object({
    body: Joi.object({
      email: Joi.string().trim().email().required(),
    }),
  }),

  /* POST /api/auth/oidc/recover */
  recoverOidcAccount: Joi.object({
    body: Joi.object({
      email: Joi.string().trim().email().required(),
      newEmail: Joi.string().trim().email().required(),
    }),
    query: Joi.object({
      group: Joi.string().required(),
    }),
  }),

  /* PUT /api/auth/oidc/recover/:token */
  changeOidcAccountEmail: Joi.object({
    params: Joi.object({
      token: Joi.string().required(),
    }),
  }),


  /* GET /api/auth/activate/:token */
  activateAccount: Joi.object({
    params: Joi.object({
      token: Joi.string().required(),
    }),
  }),

  /* GET /api/auth/profile */
  getProfile: Joi.object({
    query: Joi.object({
      group: Joi.string().required(),
    }),
  }),

  /* POST /api/auth/passwd */
  requestPasswdChange: Joi.object({
    body: Joi.object({
      email: Joi.string().trim().email().required(),
    }),
    query: Joi.object({
      group: Joi.string().required(),
    }),
  }),

  /* POST /api/auth/passwd/:token */
  resetPasswd: Joi.object({
    params: Joi.object({
      token: Joi.string().required(),
    }),
    body: Joi.object({
      password: Joi.string().regex(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[!"#$%&'()*+.\/:;<=>?@\[\\\]^_`{|}~-]).{8,}$/).required(),
    }),
  }),

  /* GET /api/auth/canSubmitForms */
  canSubmitForms: Joi.object({
    query: Joi.object({
      group: Joi.string().required(),
      user: Joi.string().optional(),
    }),
  }),

  /* PUT /api/auth/openCloseSubmission */
  openCloseSubmission: Joi.object({
    body: Joi.object({
      state: Joi.number().valid(0, 1).required(),
    }),
    query: Joi.object({
      group: Joi.string().required(),
      user: Joi.string().hex().optional(),
      usermail: Joi.string().email().optional(),
    }),
  }),

  /* GET /api/auth/latecomers */
  listLatecomers: Joi.object({
    query: Joi.object({
      group: Joi.string().required(),
    }),
  }),

  /* DELETE /api/auth/latecomers?ids=id1,id2&group= */
  removeLatecomers: Joi.object({
    query: Joi.object({
      group: Joi.string().required(),
      ids: Joi.string().required(),
    }),
  }),
};
