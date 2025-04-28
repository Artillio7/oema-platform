'use strict';

const express = require('express');

const validate = require('../../config/validation/schema-validator');
const paramValidation = require('../../config/validation/form-params.validation');
const formCtrl = require('../controllers/form.controller');
const accessControl = require('../policies/access-control.policy');
const canSubmitAppForms = require('../policies/can-submit-forms.policy');


const router = express.Router();

router.use(accessControl.isAuthorized);

/*
 * Load community when API with communityId route parameter is hit.
 */
router.param('communityId', formCtrl.loadCommunity);

/**
 * @openapi
 * /forms/community/{communityId}:
 *   get:
 *     summary: Lists application forms for a community. [Privileged route]
 *     description: This method retrieves application forms for a community
 *       (identified by the `communityId` parameter in the URL).
 *       <br>You can filter on the list by setting query parameters `filter`, `excludes` and `includes`.
 *     tags:
 *       - Forms (applications)
 *     parameters:
 *       - in: path
 *         name: communityId
 *         required: true
 *         schema:
 *           type: string
 *         description: The community ID as set in MongoDB. <mongoose.Schema.Types.ObjectId>.
 *       - in: query
 *         name: profile
 *         schema:
 *           type: integer
 *           enum: [0, 1]
 *         description: List forms with user profile or not?
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: List only the applications for this year.
 *       - in: query
 *         name: submitted
 *         schema:
 *           type: integer
 *           enum: [0, 1]
 *         description: Lists only submitted applications.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *       - in: query
 *         name: filter
 *         schema:
 *           type: object
 *       - in: query
 *         name: excludes
 *         schema:
 *           type: object
 *       - in: query
 *         name: includes
 *         schema:
 *           type: object
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: When type is set to its only value `senior`, we are getting Senior Expertise application reviews.
 *   post:
 *     summary: Creates a new application form for a community.
 *     description: This method creates a new application form for a community
 *       (identified by the `communityId` parameter in the URL).
 *       *Note that Referents/Admins can create an application for an applicant, but only in their community.*
 *     tags:
 *       - Forms (applications)
 *     parameters:
 *       - in: path
 *         name: communityId
 *         required: true
 *         schema:
 *           type: string
 *         description: The community ID as set in MongoDB. <mongoose.Schema.Types.ObjectId>.
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: When type is set to its only value `senior`, we are creating a Senior Expertise application form.
 *     requestBody:
 *       description: Info to create the application form.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: The email address of the applicant.
 *               formType:
 *                 type: string
 *                 description: The type of application (new or renewal application).
 *                 enum: [new, renew, new-senior, renew-senior]
 */
router.route('/community/:communityId')
    .get(accessControl.requiresRoles('referent', 'admin'), validate(paramValidation.getForms), formCtrl.list)
    .post(function(req, res, next) {
    // TO IMPROVE HERE with role.admin = 127 for super admin
      if (req.session.user.role.admin != 0) {
        next();

      /* Only the applicant user or Referents/admins in their own community can create */
      } else if (req.body.email && req.body.email == req.session.user.email) {
        next();
      } else {
        accessControl.requiresRolesInsideCommunity('referent', 'admin')(req, res, next);
      }
    }, canSubmitAppForms, validate(paramValidation.createForm), formCtrl.create);

/**
 * @openapi
 * /forms/community/{communityId}/preview:
 *   get:
 *     summary: Previews application forms for a community as an Excel sheet. [Privileged route]
 *     description: This method is used for an Excel export of information about applications for a community.
 *     tags:
 *       - Forms (applications)
 *     parameters:
 *       - in: path
 *         name: communityId
 *         required: true
 *         schema:
 *           type: string
 *         description: The community ID as set in MongoDB. <mongoose.Schema.Types.ObjectId>.
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: List only the applications for this year.
 *       - in: query
 *         name: submitted
 *         schema:
 *           type: integer
 *           enum: [0, 1]
 *         description: Lists only submitted applications.
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: When type is set to its only value `senior`, we are previewing a Senior Expertise application form.
 */
router.route('/community/:communityId/preview')
    .get(accessControl.requiresRoles('referent', 'admin'), validate(paramValidation.previewApplicationsExcel), formCtrl.previewApplicationsExcel);

/**
 * @openapi
 * /forms/{formId}/community/{communityId}:
 *   get:
 *     summary: Gets an application form for a community.
 *     description: This method retrieves an application form
 *       (identified by the `formId` parameter in the URL)
 *       for a community (identified by the `communityId` parameter in the URL).
 *     tags:
 *       - Forms (applications)
 *     parameters:
 *       - in: path
 *         name: formId
 *         required: true
 *         schema:
 *           type: string
 *         description: The application form ID as set in MongoDB. <mongoose.Schema.Types.ObjectId>.
 *       - in: path
 *         name: communityId
 *         required: true
 *         schema:
 *           type: string
 *         description: The community ID as set in MongoDB. <mongoose.Schema.Types.ObjectId>.
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         description: The applicant/user ID as set in MongoDB. <mongoose.Schema.Types.ObjectId>.
 *           <br>**This query parameter must be used for an applicant.**
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: When type is set to its only value `senior`, this means that we are getting a Senior Expertise application form.
 *   put:
 *     summary: Updates an application form for a community.
 *     description: This method updates an application form
 *       (identified by the `formId` parameter in the URL)
 *       for a community (identified by the `communityId` parameter in the URL).
 *     tags:
 *       - Forms (applications)
 *     parameters:
 *       - in: path
 *         name: formId
 *         required: true
 *         schema:
 *           type: string
 *         description: The application form ID as set in MongoDB. <mongoose.Schema.Types.ObjectId>.
 *       - in: path
 *         name: communityId
 *         required: true
 *         schema:
 *           type: string
 *         description: The community ID as set in MongoDB. <mongoose.Schema.Types.ObjectId>.
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         description: The applicant/user ID as set in MongoDB. <mongoose.Schema.Types.ObjectId>.
 *           <br>**This query parameter must be used for an applicant.**
 *       - in: query
 *         name: submit
 *         schema:
 *           type: integer
 *           enum: [0, 1]
 *         description: Update and also submit the application if value = 1.
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: When type is set to its only value `senior`, we are updating a Senior Expertise application form.
 *       - $ref: '#/components/parameters/groupParam'
 *     requestBody:
 *       description: Updated content for the application form.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: The email address of the applicant.
 *               formType:
 *                 type: string
 *                 description: The type of application (new or renewal application).
 *                 enum: [new, renew, new-senior, renew-senior]
 *               formTemplate:
 *                 type: object
 *                 description: The template for the application form.
 *               userAnsweredForm:
 *                 type: object
 *                 description: The user answers in the application.
 *               juryDecision:
 *                 type: object
 *                 description: Content related to the application review by the jury.
 *   delete:
 *     summary: Deletes an application form for a community.
 *     description: This method deletes an application form
 *       (identified by the `formId` parameter in the URL)
 *       for a community (identified by the `communityId` parameter in the URL).
 *     tags:
 *       - Forms (applications)
 *     parameters:
 *       - in: path
 *         name: formId
 *         required: true
 *         schema:
 *           type: string
 *         description: The application form ID as set in MongoDB. <mongoose.Schema.Types.ObjectId>.
 *       - in: path
 *         name: communityId
 *         required: true
 *         schema:
 *           type: string
 *         description: The community ID as set in MongoDB. <mongoose.Schema.Types.ObjectId>.
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         description: The applicant/user ID as set in MongoDB. <mongoose.Schema.Types.ObjectId>.
 *           <br>**This query parameter must be used for an applicant.**
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: When type is set to its only value `senior`, we are deleting a Senior Expertise application form.
 *       - $ref: '#/components/parameters/groupParam'
 */
router.route('/:formId/community/:communityId')
/* only the user or role >= Referent can access these routes */
    .all(function(req, res, next) {
    // TO IMPROVE HERE with role.admin = 127 for super admin
      if (req.session.user.role.admin != 0) {
        next();
      } else if (req.query.id && req.query.id == req.session.user.id) {
        delete req.body.juryDecision;
        next();
      } else {
        accessControl.requiresRolesInsideCommunity('referent', 'admin')(req, res, next);
      }
    })

    .get(validate(paramValidation.getForm), formCtrl.get)
    .put(canSubmitAppForms, validate(paramValidation.updateForm), formCtrl.update)
    .delete(validate(paramValidation.deleteForm), formCtrl.remove);

/**
 * @openapi
 * /forms/wizard/{formId}/community/{communityId}:
 *   get:
 *     summary: Gets the user application form with his/her profile. [Privileged route]
 *     description: This method retrieves an application form with the user profile.
 *     tags:
 *       - Forms (applications)
 *     parameters:
 *       - in: path
 *         name: formId
 *         required: true
 *         schema:
 *           type: string
 *         description: The application form ID as set in MongoDB. <mongoose.Schema.Types.ObjectId>.
 *       - in: path
 *         name: communityId
 *         required: true
 *         schema:
 *           type: string
 *         description: The community ID as set in MongoDB. <mongoose.Schema.Types.ObjectId>.
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: When type is set to its only value `senior`, we are getting a Senior Expertise application review.
 */
router.get('/wizard/:formId/community/:communityId',
    function(req, res, next) {
    // TO IMPROVE HERE with role.admin = 127
      if (req.session.user.role.admin != 0) {
        next();
      } else {
        accessControl.requiresRolesInsideCommunity('reviewer', 'referent')(req, res, next);
      }
    },
    validate(paramValidation.getForm), formCtrl.getFormWizard);

/**
 * @openapi
 * /forms/stats:
 *   get:
 *     summary: Gets submission statistics about forms. [Privileged route]
 *     description: This method provides detailed statistics about application forms for all communities (count of created applications,
 *       incl. submitted and non submitted).
 *     tags:
 *       - Forms (applications)
 *     parameters:
 *       - $ref: '#/components/parameters/groupParam'
 */
router.get('/stats', accessControl.requiresRoles('referent', 'admin'), validate(paramValidation.getStats), formCtrl.getStats);

/**
 * @openapi
 * /forms/community/{communityId}/stats:
 *   get:
 *     summary: Gets detailled statistics about application forms for a community. [Privileged route]
 *     description: This method retrieves statistics about application forms for a community
 *       (identified by the `communityId` parameter in the URL).
 *     tags:
 *       - Forms (applications)
 *     parameters:
 *       - in: path
 *         name: communityId
 *         required: true
 *         schema:
 *           type: string
 *         description: The community ID as set in MongoDB. <mongoose.Schema.Types.ObjectId>.
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: List only the applications for this year.
 */
router.get('/community/:communityId/stats',
    accessControl.requiresRoles('referent', 'admin'), validate(paramValidation.getCommunityStats), formCtrl.getCommunityStats);


module.exports = router;
