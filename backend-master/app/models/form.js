'use strict';

const Promise = require('bluebird');
const mongoose = require('mongoose');
const httpStatus = require('http-status');

const APIError = require('../helpers/APIError');


/*
 * Schema for user-submitted application forms
 */
const AppFormSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  formType: {
    type: String,
    enum: ['new', 'renew'],
    default: 'new',
  },
  year: {
    type: Number,
    default: 1 + new Date().getFullYear(),
  },
  formTemplate: {
    type: mongoose.Schema.Types.Mixed,
  },
  userAnsweredForm: {
    type: mongoose.Schema.Types.Mixed,
  },
  juryDecision: {
    type: mongoose.Schema.Types.Mixed,
  },
  submittedAt: {
    type: Date,
  },
  lastUpdatedAt: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

AppFormSchema.index({email: 1, year: 1}, {unique: true});


/*
 * Statics
 */
AppFormSchema.statics = {
  /**
   * Get user application form
   * @param {ObjectId} id - The objectId of user form.
   * @return {Promise<User, APIError>}
   */
  get(id) {
    return this.findById(id)
        .exec()
        .then((form) => {
          if (form) {
            return form;
          }
          const err = new APIError('No such application form exists!', httpStatus.NOT_FOUND);
          return Promise.reject(err);
        });
  },

  /**
   * List forms in descending order of 'createdAt' timestamp.
   * @param {object} query - Query strings to filter on values of Form model properties
   * @return {Promise<AppForm[]>}
   */
  list(query = {}) {
    const mongoQuery = {};

    if (query.filter) {
      for (const key in query.filter) {
        if (key !== 'year') {
          const {includes = '', excludes = '___'} = query.filter[key];
          mongoQuery[key] = {
            $regex: `^(?!.*${excludes.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}).*${includes.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}.*$`,
            $options: 'i',
          };
        } else {
          mongoQuery['year'] = query.filter['year'];
        }
      }
    }

    let displayFields = {};

    if (query.excludes) {
      for (const key in query.excludes) {
        if (query.excludes[key] == 1) {
          displayFields[key] = 0;
        }
      }
    }

    if (query.includes) {
      for (const key in query.includes) {
        if (query.includes[key] == 1) {
          displayFields[key] = 1;
        }
      }
    }

    if (query.excludes && query.includes) {
      displayFields = {};
    }

    if (query.limit) {
      return this.find(mongoQuery, displayFields)
          .sort({createdAt: -1})
          .skip(parseInt(query.skip || 0))
          .limit(parseInt(query.limit))
          .exec();
    } else {
      return this.find(mongoQuery, displayFields)
          .sort({createdAt: -1})
          .exec();
    }
  },
};

const Forms = {};
Forms[process.env.SOFTWARE] = mongoose.model(process.env.SOFTWARE, AppFormSchema);
Forms[process.env.COMMUNICATION_SERVICES] = mongoose.model(process.env.COMMUNICATION_SERVICES, AppFormSchema);
Forms[process.env.ENERGY_ENVIRONMENT] = mongoose.model(process.env.ENERGY_ENVIRONMENT, AppFormSchema);
Forms[process.env.FUTURE_NETWORKS] = mongoose.model(process.env.FUTURE_NETWORKS, AppFormSchema);
Forms[process.env.NETWORK_OPERATIONS] = mongoose.model(process.env.NETWORK_OPERATIONS, AppFormSchema);
Forms[process.env.SECURITY] = mongoose.model(process.env.SECURITY, AppFormSchema);
Forms[process.env.SOLUTIONS_CONTENT_SERVICES] = mongoose.model(process.env.SOLUTIONS_CONTENT_SERVICES, AppFormSchema);
Forms[process.env.BIG_DATA_AI] = mongoose.model(process.env.BIG_DATA_AI, AppFormSchema);
Forms[process.env.EXPERTS_DTSI] = mongoose.model(process.env.EXPERTS_DTSI, AppFormSchema);
Forms[process.env.DATA_UP] = mongoose.model(process.env.DATA_UP, AppFormSchema);

Forms['Senior' + process.env.SOFTWARE] = mongoose.model('Senior' + process.env.SOFTWARE, AppFormSchema);
Forms['Senior' + process.env.COMMUNICATION_SERVICES] = mongoose.model('Senior' + process.env.COMMUNICATION_SERVICES, AppFormSchema);
Forms['Senior' + process.env.ENERGY_ENVIRONMENT] = mongoose.model('Senior' + process.env.ENERGY_ENVIRONMENT, AppFormSchema);
Forms['Senior' + process.env.FUTURE_NETWORKS] = mongoose.model('Senior' + process.env.FUTURE_NETWORKS, AppFormSchema);
Forms['Senior' + process.env.NETWORK_OPERATIONS] = mongoose.model('Senior' + process.env.NETWORK_OPERATIONS, AppFormSchema);
Forms['Senior' + process.env.SECURITY] = mongoose.model('Senior' + process.env.SECURITY, AppFormSchema);
Forms['Senior' + process.env.SOLUTIONS_CONTENT_SERVICES] = mongoose.model('Senior' + process.env.SOLUTIONS_CONTENT_SERVICES, AppFormSchema);
Forms['Senior' + process.env.BIG_DATA_AI] = mongoose.model('Senior' + process.env.BIG_DATA_AI, AppFormSchema);


module.exports = Forms;
