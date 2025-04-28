/** Middleware for checking if form submission is closed **/
'use strict';

const redisClient = require('../../config/redisConnection').getClient();
const config = require('../../config/config');


async function canSubmitAppForms(req, res, next) {
  let canSubmitForms = false;

  if (req.session) {
    if (req.session.user && (req.session.user.role.referent != 0 || req.session.user.role.admin != 0)) {
      canSubmitForms = true;
    } else if (req.session.group) {
      const value = await redisClient.get(config[req.session.group].redis);
      if (value) {
        const userValue = await redisClient.get(`${config[req.session.group].redis}-${req.session.user.id}`);
        if (userValue) {
          canSubmitForms = true;
        }
      } else {
        canSubmitForms = true;
      }
    }
  }

  if (canSubmitForms) {
    next();
  } else {
    res.status(403).json({success: false, message: 'Sorry, application submission is closed.'});
  }
}


module.exports = canSubmitAppForms;
