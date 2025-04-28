/* eslint no-invalid-this: 0 */
'use strict';

const Promise = require('bluebird');
const mongoose = require('mongoose');
const Int32 = require('mongoose-int32').loadType(mongoose);
const bcrypt = Promise.promisifyAll(require('bcrypt'));
const httpStatus = require('http-status');

const APIError = require('../helpers/APIError');


/*
 * Role Schema
 * Be careful : by default, mongo CLI use the double type (1),
 * you need to explicitly use NumberInt to use the bson 16/Int32 type.
 * useful cmds to reformat if needed:
 * db.users.find({'role.reviewer': {$type: 1}}).forEach(function(u) { u.role.reviewer = new NumberInt(u.role.reviewer); db.users.save(u); })
 * db.users.find({'role.referent': {$type: 1}}).forEach(function(u) { u.role.referent = new NumberInt(u.role.referent); db.users.save(u); })
 * db.users.find({'role.admin': {$type: 1}}).forEach(function(u) { u.role.admin = new NumberInt(u.role.admin); db.users.save(u); })
 */
const RoleSchema = new mongoose.Schema({
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
});

/* const ExpertSchema = new mongoose.Schema({
  expert: {
    type: Int32,
    default: 0,
  },
  renew: {
    type: Date,
    default: 3 + new Date().getFullYear(),
  },
  _id: false,
});*/

/*
 * Application Schema
 */
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

const UserSchema = new mongoose.Schema({
  email: { // use email to uniquely identify users
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  cuid: {
    type: String,
  },
  role: {
    type: RoleSchema,
  },
  /* expert: {
    type: ExpertSchema,
  },*/
  account: {
    type: String,
    enum: ['pending', 'active', 'inactive', 'suspended', 'enabled'],
    default: 'pending',
  },
  photo: {
    type: String, // filename for user photo
  },
  firstname: {
    type: String,
  },
  lastname: {
    type: String,
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'N/A'],
  },
  birthday: {
    type: String,
  },
  phone: {
    type: String,
  },
  classification: {
    type: String,
  },
  entity: {
    type: String,
  },
  location: {
    type: String,
  },
  country: {
    type: String,
  },
  managerFirstname: {
    type: String,
  },
  managerLastname: {
    type: String,
  },
  managerEmail: {
    type: String,
  },
  hrFirstname: {
    type: String,
  },
  hrLastname: {
    type: String,
  },
  hrEmail: {
    type: String,
  },
  directoryUrl: {
    type: String,
  },
  history: {
    type: [ApplicationSchema],
  },
  community: {
    type: Int32,
    default: 0,
  },
  acceptPolicy: {
    type: Boolean,
    default: false,
  },
  lastLogin: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});


/**
 * - pre-save hooks
 * - validations
 * - virtuals
 */
/*
 * Be sure to hash passswords on pre-save and pre-update hooks
 */
UserSchema.pre('save', async function(next) {
  if ((!this.isModified('password') && !this.isNew) || (this.account === 'enabled')) {
    return next();
  }

  try {
    const hash = await bcrypt.hashAsync(this.password, 10);
    this.password = hash;
    next();
  } catch (err) {
    next(err);
  }
});
UserSchema.pre('update', async function(next) {
  const update = this._update;
  if (update.$set && update.$set.password) {
    try {
      const hash = await bcrypt.hashAsync(update.$set.password, 10);
      this.findOneAndUpdate({}, {$set: {password: hash}});
      next();
    } catch (err) {
      next(err);
    }
  } else {
    next();
  }
});
UserSchema.pre('updateOne', async function(next) {
  const update = this._update;
  if (update.$set && update.$set.password) {
    try {
      const hash = await bcrypt.hashAsync(update.$set.password, 10);
      this.findOneAndUpdate({}, {$set: {password: hash}});
      next();
    } catch (err) {
      next(err);
    }
  } else {
    next();
  }
});

/* Remove the password field when displaying user data */
UserSchema.set('toJSON', {
  transform: function(doc, ret, options) {
    delete ret.password;
    return ret;
  },
});


/*
 * Methods
 */
UserSchema.method({
  passwordIsValid(passwd) {
    try {
      return bcrypt.compareAsync(passwd, this.password);
    } catch (err) {
      throw err;
    }
  },
});


/*
 * Statics
 */
UserSchema.statics = {
  /**
   * Get user
   * @param {ObjectId} id - The objectId of user.
   * @return {Promise<User, APIError>}
   */
  get(id) {
    return this.findById(id)
        .exec()
        .then((user) => {
          if (user) {
            return user;
          }
          const err = new APIError('No such user exists!', httpStatus.NOT_FOUND);
          return Promise.reject(err);
        });
  },

  /**
   * List users in descending order of 'createdAt' timestamp.
   * @param {object} query - Query strings to filter on values of User model properties
   * @return {Promise<User[]>}
   */
  list(query = {}) {
    const mongoQuery = {};

    if (query.filter) {
      for (const key in query.filter) {
        if ({}.hasOwnProperty.call(query.filter, key)) {
          const {includes = '', excludes = '___'} = query.filter[key];
          mongoQuery[key] = {
            $regex: `^(?!.*${excludes.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}).*${includes.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}.*$`,
            $options: 'i',
          };
        }
      }
    }

    if (query.search) {
      const fields = ['firstname', 'lastname', 'email', 'birthday', 'phone', 'cuid', 'entity', 'location', 'country',
        'managerFirstname', 'managerLastname', 'managerEmail', 'hrFirstname', 'hrLastname', 'hrEmail'];
      const queries = [];
      const sRegex = new RegExp(query.search.trim(), 'i');
      for (const field of fields) {
        queries.push({
          [field]: {
            $regex: sRegex,
          },
        });
      }

      mongoQuery['$or'] = queries;
    }

    // We only enable sorting by firstname, lastname, or createdAt
    const sort = query.sort && query.sort !== 'created' ? query.sort : 'createdAt';

    if (sort === 'createdAt') {
      if (query.limit) {
        return this.find(mongoQuery)
            .sort({[sort]: parseInt(query.order || 1)})
            .skip(parseInt(query.skip || 0))
            .limit(parseInt(query.limit))
            .exec();
      } else {
        return this.find(mongoQuery)
            .sort({[sort]: parseInt(query.order || 1)})
            .exec();
      }
    } else {
      const order = parseInt(query.order || 1);
      const aggr = [
        {
          $project: {
            [sort]: 1, firstname: 1, lastname: 1, email: 1, cuid: 1, gender: 1, birthday: 1, phone: 1, classification: 1,
            entity: 1, location: 1, country: 1, managerFirstname: 1, managerLastname: 1, managerEmail: 1,
            hrFirstname: 1, hrLastname: 1, hrEmail: 1, history: 1, directoryUrl: 1, role: 1, createdAt: 1,
            sfield: {$ifNull: [`$${sort}`, order === 1 ? 'ŽŽŽŽŽ' : '99999']}, // move empty fields to the end
          },
        },
        {$match: mongoQuery},
        {$sort: {'sfield': order}},
      ];

      if (query.limit) {
        aggr.push({$skip: parseInt(query.skip || 0)}, {$limit: parseInt(query.limit)});
      }

      return this.aggregate(aggr).exec();
    }
  },
};


module.exports = mongoose.model('User', UserSchema);
