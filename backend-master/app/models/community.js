'use strict';

const Promise = require('bluebird');
const mongoose = require('mongoose');
const Int32 = require('mongoose-int32').loadType(mongoose);
const httpStatus = require('http-status');

const APIError = require('../helpers/APIError');


/*
 * Community Schema
 */
const Question = new mongoose.Schema({
  label: String,
  type: String,
  name: String,
  options: mongoose.Schema.Types.Mixed,
});

const FormGroup = new mongoose.Schema({
  group: String,
  questions: [Question],
});

const WizardStep = new mongoose.Schema({
  name: String,
  icon: String,
  active: Boolean,
  valid: Boolean,
  hasError: Boolean,
  form: [FormGroup],
});

const CommunitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  label: {
    // possible values are process.env.SOFTWARE, process.env.COMMUNICATION_SERVICES, process.env.ENERGY_ENVIRONMENT,
    // process.env.FUTURE_NETWORKS, process.env.NETWORK_OPERATIONS, process.env.SECURITY, process.env.SOLUTIONS_CONTENT_SERVICES
    // CANNOT BE CHANGED AFTER DOCUMENT CREATION
    type: String,
    unique: true,
    required: true,
  },
  flag: {
    type: Int32,
    unique: true,
    required: true,
  },
  referentName: {
    type: String,
  },
  referentMail: {
    type: String,
  },
  reviewers: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
  seniorReviewers: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],

  newForm: [WizardStep],
  renewalForm: [WizardStep],
  newFormBackup: [WizardStep],
  renewalFormBackup: [WizardStep],
  newFormDraft: [WizardStep],
  renewalFormDraft: [WizardStep],

  newSeniorForm: [WizardStep],
  renewalSeniorForm: [WizardStep],
  newSeniorFormBackup: [WizardStep],
  renewalSeniorFormBackup: [WizardStep],
  newSeniorFormDraft: [WizardStep],
  renewalSeniorFormDraft: [WizardStep],

  createdAt: {
    type: Date,
    default: Date.now,
  },
});


/*
 * Statics
 */
CommunitySchema.statics = {
  /**
   * Get community
   * @param {ObjectId} id - The objectId of community.
   * @return {Promise<Community, APIError>}
   */
  get(id) {
    return this.findById(id)
        .exec()
        .then((community) => {
          if (community) {
            return community;
          }
          const err = new APIError('Community not found!', httpStatus.NOT_FOUND);
          return Promise.reject(err);
        });
  },

  /**
   * List communities in descending order of 'createdAt' timestamp.
   * @param {object} query - Query strings to filter on values of Community model properties
   * @return {Promise<Community[]>}
   */
  list(query = {}) {
    const mongoQuery = {};

    if (query.filter) {
      for (const key in query.filter) {
        if (typeof query.filter[key] !== 'object') {
          mongoQuery[key] = query.filter[key];
        } else {
          const {includes = '', excludes = '___'} = query.filter[key];
          mongoQuery[key] = {
            $regex: `^(?!.*${excludes.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}).*${includes.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}.*$`,
            $options: 'i',
          };
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

    return this.find(mongoQuery, displayFields)
        .sort({name: 1})
        .exec();
  },
};


module.exports = mongoose.model('Community', CommunitySchema);
