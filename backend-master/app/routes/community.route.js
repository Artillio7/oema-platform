'use strict';

const express = require('express');

const validate = require('../../config/validation/schema-validator');
const paramValidation = require('../../config/validation/community-params.validation');
const communityCtrl = require('../controllers/community.controller');
const accessControl = require('../policies/access-control.policy');


const router = express.Router();

router.use(accessControl.isAuthorized);

/*
 * Load user when API with communityId route parameter is hit.
 */
router.param('communityId', communityCtrl.loadCommunity);

/**
 * @openapi
 * /communities:
 *   get:
 *     summary: Lists communities.
 *     description: This method retrieves the list of communities.
 *       <br>You can filter on the list by setting query parameters `filter`, `excludes` and `includes`.
 *     tags:
 *       - Communities
 *     parameters:
 *       - $ref: '#/components/parameters/groupParam'
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: The community name.
 *       - in: query
 *         name: reviewers
 *         schema:
 *           type: integer
 *           enum: [0, 1]
 *         description: Set reviewers to 1 to retrieve the list of the reviewers for the community (Must be used with the query parameter name).
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: When type is set to its only value `senior`, we are getting the reviewers for the Senior Expertise programme.
 *          (Must be used with the query parameters name and reviewers!).
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
 *   post:
 *     summary: Creates a new community. [Privileged route]
 *     description: This methods creates a new community.
 *     tags:
 *       - Communities
 *     requestBody:
 *       description: Info to create the community.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The community name.
 *               label:
 *                 type: string
 *                 description: A label to uniquely identify the community in MongoDB.
 *                   Immutable value, cannot be modified.
 *               referentName:
 *                 type: string
 *                 description: The name of the Referent for the community.
 *               referentMail:
 *                 type: string
 *                 description: The email address of the Referent for the community.
 *               newForm:
 *                 type: object
 *               renewalform:
 *                 type: object
 *             required:
 *               - name
 *               - label
 */
router.route('/')
    .get(function(req, res, next) {
      if (req.query.reviewers && req.query.name) {
        accessControl.requiresRoles('referent', 'admin')(req, res, next);
      } else {
        next();
      }
    }, validate(paramValidation.getCommunities), communityCtrl.list)
    .post(accessControl.requiresRoles('referent', 'admin'), validate(paramValidation.createCommunity), communityCtrl.create);

/**
 * @openapi
 * /communities/{communityId}:
 *   get:
 *     summary: Gets a community.
 *     description: This method retrieves info about a community
 *       by using its ID as a parameter in the URL.
 *     tags:
 *       - Communities
 *     parameters:
 *       - in: path
 *         name: communityId
 *         required: true
 *         schema:
 *           type: string
 *         description: The community ID as set in MongoDB. <mongoose.Schema.Types.ObjectId>.
 *   put:
 *     summary: Updates a community. [Privileged route]
 *     description: This method updates info about a community
 *       by using its ID as a parameter in the URL.
 *     tags:
 *       - Communities
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
 *         description: When type is set to its only value `senior`, we are modifying the form templates for the Senior Expertise programme.
 *     requestBody:
 *       description: Updated content related to the community.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The community name.
 *               referentName:
 *                 type: string
 *                 description: The name of the Referent for the community.
 *               referentMail:
 *                 type: string
 *                 description: The email address of the Referent for the community.
 *               newForm:
 *                 type: object
 *                 description: The form for a new application.
 *               renewalform:
 *                 type: object
 *                 description: The form for a renewal application.
 *   delete:
 *     summary: Deletes a community. [Privileged route]
 *     description: This method deletes a community
 *       identified by its ID as a parameter in the URL.
 *     tags:
 *       - Communities
 *     parameters:
 *       - in: path
 *         name: communityId
 *         required: true
 *         schema:
 *           type: string
 *         description: The community ID as set in MongoDB. <mongoose.Schema.Types.ObjectId>.
 */
router.route('/:communityId')
    .get(communityCtrl.get)
    .put(accessControl.requiresRoles('referent', 'admin'), validate(paramValidation.updateCommunity), communityCtrl.update)
    .delete(accessControl.requiresRoles('referent', 'admin'), communityCtrl.remove);

/**
 * @openapi
 * /communities/{communityId}/reviewers:
 *   get:
 *     summary: Gets the list of reviewers for a community. [Privileged route]
 *     description: This method lists the reviewers of a community
 *       by using its ID as a parameter in the URL.
 *     tags:
 *       - Communities
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
 *         description: When type is set to its only value `senior`, we are getting the reviewers for the Senior Expertise programme.
 */
router.get('/:communityId/reviewers', accessControl.requiresRolesInsideCommunity('referent', 'admin'),
    validate(paramValidation.listByCommunityId), communityCtrl.listReviewersByCommunityId);

/**
 * @openapi
 * /communities/{communityId}/referents:
 *   get:
 *     summary: Gets the list of referents for a community. [Privileged route]
 *     description: This method lists the referents of a community
 *       by using its ID as a parameter in the URL.
 *     tags:
 *       - Communities
 *     parameters:
 *       - in: path
 *         name: communityId
 *         required: true
 *         schema:
 *           type: string
 *         description: The community ID as set in MongoDB. <mongoose.Schema.Types.ObjectId>.
 */
router.get('/:communityId/referents', accessControl.requiresRoles('referent', 'admin'),
    validate(paramValidation.listByCommunityId), communityCtrl.listReferentsByCommunityId);


module.exports = router;
