'use strict';

const express = require('express');

const validate = require('../../config/validation/schema-validator');
const paramValidation = require('../../config/validation/review-params.validation');
const reviewCtrl = require('../controllers/review.controller');
const accessControl = require('../policies/access-control.policy');


const router = express.Router();

router.use(accessControl.isAuthorized);

/*
 * Load community when API with communityId route parameter is hit.
 */
router.param('communityId', reviewCtrl.loadCommunity);

/**
 * @openapi
 * /reviews/community/{communityId}/settings:
 *   get:
 *     summary: Gets the settings for the reviews page (per community). [Privileged route]
 *     description: This method retrieves the reviews page settings
 *       used by the community whose ID is the `communityId` parameter in the URL.
 *     tags:
 *       - Reviews
 *     parameters:
 *       - in: path
 *         name: communityId
 *         required: true
 *         schema:
 *           type: string
 *         description: The community ID as set in MongoDB. <mongoose.Schema.Types.ObjectId>.
 *   put:
 *     summary: Sets settings for the review page (per community). [Privileged route]
 *     description: This method allows to configure settings for the review page,
 *       as used by the community whose ID is the `communityId` parameter in the URL.
 *     tags:
 *       - Reviews
 *     parameters:
 *       - in: path
 *         name: communityId
 *         required: true
 *         schema:
 *           type: string
 *         description: The community ID as set in MongoDB. <mongoose.Schema.Types.ObjectId>.
 *     requestBody:
 *       description: Settings to set/modify.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startReviewing:
 *                 type: integer
 *                 enum: [0, 1]
 *                 description: Set the review table visible.
 *               canAssignReviewers:
 *                 type: integer
 *                 enum: [0, 1]
 *                 description: Allow reviewers to select their applicants.
 *               lockReviewers:
 *                 type: integer
 *                 enum: [0, 1]
 *                 description: Lock reviewer-entered data (freeze their reviews).
 *               visibleReviews:
 *                 type: integer
 *                 enum: [0, 1]
 *                 description: Allow a reviewer to see other reviews.
 *               hiddenColumnsFromReviewers:
 *                 type: string
 *                 description: List of columns which are hidden from reviewers.
 */
router.route('/community/:communityId/settings')
    .get(accessControl.requiresRolesInsideCommunity('reviewer', 'referent', 'admin'),
        validate(paramValidation.getReviewSettings), reviewCtrl.getReviewSettings)
    .put(accessControl.requiresRolesInsideCommunity('referent'),
        validate(paramValidation.putReviewSettings), reviewCtrl.putReviewSettings);

/**
 * @openapi
 * /reviews/community/{communityId}/populate:
 *   get:
 *     summary: Builds a review table for a community. [Privileged route]
 *     description: This method allows a Referent to build the [applicants]x[reviewers] table
 *       for his/her community (as identified by the `communityId` parameter in the URL)
 *       so that the reviewers can start to select and review the applications.
 *     tags:
 *       - Reviews
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
 *         description: When type is set to its only value `senior`, we are updating the review table for Senior Expertise applications.
 */
router.route('/community/:communityId/populate')
    .get(accessControl.requiresRolesInsideCommunity('referent'), validate(paramValidation.buildReviewCollection), reviewCtrl.buildReviewCollection);

/**
 * @openapi
 * /reviews/community/{communityId}/repopulate:
 *   get:
 *     summary: Rebuilds the review table for a community. [Privileged route]
 *     description: This method allows a Referent to rebuild the reviews table
 *       for his/her community (as identified by the `communityId` parameter in the URL),
 *       while taking into account new updates from application forms.
 *       <br>*Especially, this is required when an application is submitted after starting the review process.*
 *     tags:
 *       - Reviews
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
 *         description: When type is set to its only value `senior`, we are rebuilding the review table for Senior Expertise applications.
 */
router.route('/community/:communityId/repopulate')
    .get(accessControl.requiresRolesInsideCommunity('reviewer', 'referent', 'admin'),
        validate(paramValidation.rebuildReviewCollection), reviewCtrl.rebuildReviewCollection);

/**
 * @openapi
 * /reviews/community/{communityId}/count:
 *   get:
 *     summary: Gets the number of applications to review for a community. [Privileged route]
 *     description: This method retrieves the number of applications
 *       that need to be reviewed for a community
 *       (identified by its name in the `community` query parameter in the URL).
 *     tags:
 *       - Reviews
 *     parameters:
 *       - in: path
 *         name: communityId
 *         required: true
 *         schema:
 *           type: string
 *         description: The community ID as set in MongoDB. <mongoose.Schema.Types.ObjectId>.
 */
router.route('/community/:communityId/count')
    .get(accessControl.requiresRoles('referent', 'admin'),
        validate(paramValidation.getNbAppsToReview), reviewCtrl.getNbAppsToReview);

/**
 * @openapi
 * /reviews/community/{communityId}:
 *   get:
 *     summary: Lists all reviews from a community. [Privileged route]
 *     description: This method gets the list of application reviews created by a community
 *       (identified by the `communityId` parameter in the URL).
 *       <br>You can filter on the list by setting query parameters `filter`, `excludes` and `includes`.
 *     tags:
 *       - Reviews
 *     parameters:
 *       - in: path
 *         name: communityId
 *         required: true
 *         schema:
 *           type: string
 *         description: The community ID as set in MongoDB. <mongoose.Schema.Types.ObjectId>.
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
 *         name: template
 *         schema:
 *           type: integer
 *           enum: [0, 1]
 *         description: Keep only user answers in the review (i.e. we remove all items used to render the application form following a template).
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: When type is set to its only value `senior`, this means that we are getting Senior Expertise application reviews.
 *   post:
 *     summary: Creates a new review for a community. [Privileged route]
 *     description: This method creates a new review for a community
 *       (identified by the `communityId` parameter in the URL).
 *     tags:
 *       - Reviews
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
 *         description: When type is set to its only value `senior`, we are creating a Senior Expertise application review.
 *     requestBody:
 *       description: The application for which the review is created is identified by its ID.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               formId:
 *                 type: string
 *                 description: The application form ID as set in MongoDB. <mongoose.Schema.Types.ObjectId>.
 */
router.route('/community/:communityId')
/* Due to the review settings, only Referents can list complete application reviews */
    .get(accessControl.requiresRolesInsideCommunity('reviewer', 'referent', 'admin'),
        validate(paramValidation.getReviews), reviewCtrl.list)
    .post(accessControl.requiresRolesInsideCommunity('reviewer', 'referent', 'admin'),
        validate(paramValidation.createReview), reviewCtrl.create);

/**
 * @openapi
 * /reviews/{reviewId}/community/{communityId}:
 *   get:
 *     summary: Gets an application review by its ID from a community. [Privileged route]
 *     description: This method retrieves an application review
 *       (identified by its ID as set by the `reviewId` parameter in the URL)
 *       from a community
 *       (identified by its ID as set by the `communityId` parameter in the URL).
 *     tags:
 *       - Reviews
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *         description: The application review ID as set in MongoDB. <mongoose.Schema.Types.ObjectId>.
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
 *   put:
 *     summary: Updates an application review by its ID in a community. [Privileged route]
 *     description: This method allows to update an application review
 *       (identified by its ID as set by the `reviewId` parameter in the URL)
 *       for a community
 *       (identified by its ID as set by the `communityId` parameter in the URL).
 *     tags:
 *       - Reviews
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *         description: The application review ID as set in MongoDB. <mongoose.Schema.Types.ObjectId>.
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
 *         description: When type is set to its only value `senior`, we are updating a Senior Expertise application review.
 *     requestBody:
 *       description: Updated content for the application form.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notesAboutApplicant:
 *                 type: string
 *                 description: Some notes regarding the applicant.
 *               reviewer:
 *                 description: A JSON object describing the reviewer's review.
 *                 type: object
 *                 properties:
 *                   reviewer:
 *                     type: string
 *                     description: The reviewer firstname and lastname.
 *                   reviews:
 *                     type: string
 *                     enum: ['', 'yes', 'no', 'maybe']
 *                     description: Does the reviewer review this application? (May be empty to indicate there is no answer).
 *                   rating:
 *                     type: string
 *                     enum: ['', '-2', '-1', '0', '+1', '+2']
 *                   comments:
 *                     type: string
 *                     description: The reviewer comments about the application.
 *               deliberation:
 *                 description: A JSON object describing the final deliberation regarding the application.
 *                 type: object
 *                 properties:
 *                   comments:
 *                     type: string
 *                     description: The community referent comments about the application.
 *                   status:
 *                     type: string
 *                     description: Text describing the status of the application (accepted, rejected, etc).
 *                   recommendation:
 *                     type: string
 *                     description: The community referent writes a recommendation for the applicant.
 *                   notes:
 *                     type: string
 *                     description: Some notes about the application.
 *               notification:
 *                 type: string
 *                 description: Text describing the notification made to announce the deliberation to the applicant.
 *   delete:
 *     summary: Deletes an application review by its ID in a community. [Privileged route]
 *     description: This method allows to delete an application review
 *       (identified by its ID as set by the `reviewId` parameter in the URL)
 *       for a community
 *       (identified by its ID as set by the `communityId` parameter in the URL).
 *     tags:
 *       - Reviews
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *         description: The application review ID as set in MongoDB. <mongoose.Schema.Types.ObjectId>.
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
 *         description: When type is set to its only value `senior`, we are deleting a Senior Expertise application review.
 */
router.route('/:reviewId/community/:communityId')
/* only the role >= Reviewer can access these routes */
    .all(accessControl.requiresRolesInsideCommunity('reviewer', 'referent', 'admin'))

    .get(validate(paramValidation.getReviewById), reviewCtrl.get)

    .put(function(req, res, next) {
      if (Object.keys(req.body).length == 1 &&
        ((req.body.reviewer && req.body.reviewer.reviewer === req.session.user.id) ||
              req.body.notesAboutApplicant !== undefined)) {
        next();
      } else {
        accessControl.requiresRolesInsideCommunity('referent')(req, res, next);
      }
    }, validate(paramValidation.updateReview), reviewCtrl.update)

    .delete(accessControl.requiresRolesInsideCommunity('referent'),
        validate(paramValidation.deleteReview), reviewCtrl.remove);

/**
 * @openapi
 * /reviews/form/{formId}/community/{communityId}:
 *   get:
 *     summary: Gets an application review by form ID from a community. [Privileged route]
 *     description: This method retrieves an application review
 *       (identified by the form ID as set by the `formId` parameter in the URL)
 *       from a community
 *       (identified by its ID as set by the `communityId` parameter in the URL).
 *     tags:
 *       - Reviews
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
router.route('/form/:formId/community/:communityId')
    .get(accessControl.requiresRoles('referent'), validate(paramValidation.getReviewByFormId), reviewCtrl.getReviewByFormId);


module.exports = router;
