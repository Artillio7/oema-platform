'use strict';

const Promise = require('bluebird');
const mongoose = require('mongoose');
const Int32 = require('mongoose-int32').loadType(mongoose);
const httpStatus = require('http-status');

const APIError = require('../helpers/APIError');
// const User = require('./user');


const ApplicationSchema = new mongoose.Schema({
  community: String, // the (full) name of a community
  communityId: mongoose.Schema.Types.ObjectId,
  formType: {
    type: String,
    enum: ['new', 'renew', 'new-senior', 'renew-senior'],
    default: 'new',
  },
  status: {
    type: String,
    enum: ['preparing', 'writing', 'submitted', 'accepted', 'withdrew', 'refused'],
    default: 'preparing',
  },
  year: Number,
  submittedAt: Date,
  info: String,
  formId: mongoose.Schema.Types.ObjectId,
});

const UserProfile = new mongoose.Schema({
  email: String,
  cuid: String,
  firstname: String,
  lastname: String,
  gender: String,
  birthday: String,
  phone: String,
  classification: String,
  entity: String,
  location: String,
  country: String,
  managerFirstname: String,
  managerLastname: String,
  managerEmail: String,
  hrFirstname: String,
  hrLastname: String,
  hrEmail: String,
  role: {
    reviewer: {
      type: Int32,
      default: 0,
    },
    referent: {
      type: Int32,
      default: 0,
    },
    admin: {
      type: Int32,
      default: 0,
    },
    _id: false,
  },
  community: Int32,
  history: [ApplicationSchema],
});

const Reviewer = new mongoose.Schema({
  reviewer: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  reviews: {
    type: String,
    enum: ['yes', 'maybe', 'no', ''],
  },
  rating: {
    type: mongoose.Schema.Types.Mixed,
  },
  comments: String,
});

/* const Deliberation = new mongoose.Schema({
  comments: String,
  status: String,
  recommendation: String,
  notes: String
});*/

/*
 * Schema for Reviews (with their form submitted)
 */
const ReviewSchema = new mongoose.Schema({
  applicant: {
    type: UserProfile,
  },
  formId: {
    type: mongoose.Schema.Types.ObjectId,
    unique: true,
  },
  /* communityId: {
    type: mongoose.Schema.Types.ObjectId
  },*/
  formType: {
    type: String,
    enum: ['new', 'renew'],
  },
  year: {
    type: Number,
    default: 1 + new Date().getFullYear(),
  },
  userAppFormData: {
    type: mongoose.Schema.Types.Mixed,
  },
  notesAboutApplicant: {
    type: String,
  },
  reviewers: {
    type: [Reviewer],
  },
  rate: {
    type: mongoose.Schema.Types.Mixed,
  },
  deliberation: {
    type: mongoose.Schema.Types.Mixed,
  },
  notification: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
// }, {collation: { locale: "en", strength: 2 }});

// ReviewSchema.index({formId:1, communityId:1}, {unique: true});

/*
 * Statics
 */
ReviewSchema.statics = {
  /**
   * Get the review by Id (for an applicant)
   * @param {ObjectId} id - The objectId of the review.
   * @return {Promise<User, APIError>}
   */
  get(id) {
    return this.findById(id)
        .exec()
        .then((review) => {
          if (review) {
            return review;
          }
          const err = new APIError('No such review exists!', httpStatus.NOT_FOUND);
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
        if ({}.hasOwnProperty.call(query.filter, key)) {
          if (key === 'applicant' || key === 'deliberation') {
            for (const field in query.filter[key]) {
              if ({}.hasOwnProperty.call(query.filter[key], field)) {
                const {includes = '', excludes = '___'} = query.filter[key][field];
                mongoQuery[`${key}.${field}`] = {
                  $regex: `^(?!.*${excludes.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}).*${includes.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}.*$`,
                  $options: 'i',
                };
              }
            }
          } else if (key !== 'year') {
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
      if (Object.keys(displayFields).length === 0) {
        return this.find(mongoQuery)
            .sort({'applicant.lastname': 1})
            .skip(parseInt(query.skip || 0))
            .limit(parseInt(query.limit))
            .lean() // to get plain JS object instead of Mongo Document (to use with the mongoose populate function)
            .exec();
      } else {
        return this.find(mongoQuery)
            .select(displayFields)
            .sort({'applicant.lastname': 1})
            .skip(parseInt(query.skip || 0))
            .limit(parseInt(query.limit))
            .lean()
            .exec();
      }
    } else {
      if (Object.keys(displayFields).length === 0) {
        return this.find(mongoQuery)
            .sort({'applicant.lastname': 1})
            .lean()
            .exec();
      } else {
        return this.find(mongoQuery)
            .select(displayFields)
            .sort({'applicant.lastname': 1})
            .lean()
            .exec();
      }
    }
  },
};

const Reviews = {};
Reviews[process.env.SOFTWARE] = mongoose.model(process.env.SOFTWARE + 'Review', ReviewSchema);
Reviews[process.env.COMMUNICATION_SERVICES] = mongoose.model(process.env.COMMUNICATION_SERVICES + 'Review', ReviewSchema);
Reviews[process.env.ENERGY_ENVIRONMENT] = mongoose.model(process.env.ENERGY_ENVIRONMENT + 'Review', ReviewSchema);
Reviews[process.env.FUTURE_NETWORKS] = mongoose.model(process.env.FUTURE_NETWORKS + 'Review', ReviewSchema);
Reviews[process.env.NETWORK_OPERATIONS] = mongoose.model(process.env.NETWORK_OPERATIONS + 'Review', ReviewSchema);
Reviews[process.env.SECURITY] = mongoose.model(process.env.SECURITY + 'Review', ReviewSchema);
Reviews[process.env.SOLUTIONS_CONTENT_SERVICES] = mongoose.model(process.env.SOLUTIONS_CONTENT_SERVICES + 'Review', ReviewSchema);
Reviews[process.env.BIG_DATA_AI] = mongoose.model(process.env.BIG_DATA_AI + 'Review', ReviewSchema);
Reviews[process.env.EXPERTS_DTSI] = mongoose.model(process.env.EXPERTS_DTSI + 'Review', ReviewSchema);
Reviews[process.env.DATA_UP] = mongoose.model(process.env.DATA_UP + 'Review', ReviewSchema);

Reviews['Senior' + process.env.SOFTWARE] = mongoose.model('Senior' + process.env.SOFTWARE + 'Review', ReviewSchema);
Reviews['Senior' + process.env.COMMUNICATION_SERVICES] = mongoose.model('Senior' + process.env.COMMUNICATION_SERVICES + 'Review', ReviewSchema);
Reviews['Senior' + process.env.ENERGY_ENVIRONMENT] = mongoose.model('Senior' + process.env.ENERGY_ENVIRONMENT + 'Review', ReviewSchema);
Reviews['Senior' + process.env.FUTURE_NETWORKS] = mongoose.model('Senior' + process.env.FUTURE_NETWORKS + 'Review', ReviewSchema);
Reviews['Senior' + process.env.NETWORK_OPERATIONS] = mongoose.model('Senior' + process.env.NETWORK_OPERATIONS + 'Review', ReviewSchema);
Reviews['Senior' + process.env.SECURITY] = mongoose.model('Senior' + process.env.SECURITY + 'Review', ReviewSchema);
Reviews['Senior' + process.env.SOLUTIONS_CONTENT_SERVICES] = mongoose.model('Senior' + process.env.SOLUTIONS_CONTENT_SERVICES + 'Review', ReviewSchema);
Reviews['Senior' + process.env.BIG_DATA_AI] = mongoose.model('Senior' + process.env.BIG_DATA_AI + 'Review', ReviewSchema);
Reviews['Review'] = mongoose.model('Review', ReviewSchema);

module.exports = Reviews;
