'use strict';

const express = require('express');

const validate = require('../../config/validation/schema-validator');
const paramValidation = require('../../config/validation/form-wizard-params.validation');
const formwizardCtrl = require('../controllers/form-wizard.controller');
const accessControl = require('../policies/access-control.policy');


const router = express.Router();

router.use(accessControl.isAuthorized);

/**
 * @openapi
 * /formwizards/{communityId}:
 *   get:
 *     summary: Gets the form wizard for a community.
 *     description: This method retrieves the form wizard to let an applicant apply for a community.
 *     tags:
 *       - Formwizards
 *     parameters:
 *       - in: path
 *         name: communityId
 *         required: true
 *         schema:
 *           type: string
 *         description: The community ID as set in MongoDB. <mongoose.Schema.Types.ObjectId>.
 *       - in: query
 *         name: "type"
 *         schema:
 *           type: string
 *           enum: [new, renew]
 */
router.route('/:communityId')
/* GET /api/formwizards/:communityId?type={new,renew} */
/* Get the form wizard from communityId */
    .get(validate(paramValidation.getFormWizard), formwizardCtrl.getFormWizardFromCommunity);


module.exports = router;
