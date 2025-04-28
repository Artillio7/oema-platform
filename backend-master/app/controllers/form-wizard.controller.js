'use strict';

const Community = require('../models/community');


/*
 * Get form wizard from the community req.params.communityId.
 */
function getFormWizardFromCommunity(req, res, next) {
  Community.findById(req.params.communityId, 'newForm renewalForm newSeniorForm renewalSeniorForm').exec()
      .then((community) => {
        switch (req.query.type) {
          case 'new':
            return res.json(community.newForm);
          case 'renew':
            return res.json(community.renewalForm);
          case 'new-senior':
            return res.json(community.newSeniorForm);
          case 'renew-senior':
            return res.json(community.renewalSeniorForm);
          default:
            return res.json([]);
        }
      })
      .catch((e) => next(e));
}


module.exports = {getFormWizardFromCommunity};
