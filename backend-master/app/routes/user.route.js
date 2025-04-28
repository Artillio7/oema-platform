'use strict';

const express = require('express');

const validate = require('../../config/validation/schema-validator');
const paramValidation = require('../../config/validation/user-params.validation');
const userCtrl = require('../controllers/user.controller');
const accessControl = require('../policies/access-control.policy');
const canSubmitAppForms = require('../policies/can-submit-forms.policy');

const Community = require('../models/community');


const router = express.Router();

router.use(accessControl.isAuthorized);

/*
 * Load user when API with userId route parameter is hit.
 */
router.param('userId', userCtrl.loadUser);

/**
 * @openapi
 * /users:
 *   get:
 *     summary: Lists users. [Privileged route]
 *     description: This method retrieves the list of users.
 *       <br>You can filter on the list by setting the `filter` query parameter.
 *     tags:
 *       - Users
 *     parameters:
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
 *   post:
 *     summary: Creates a new user. [Privileged route]
 *     description: This methods creates a new user.
 *     tags:
 *       - Users
 *     requestBody:
 *       description: Info to create the user.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: The user email.
 *               password:
 *                 type: string
 *                 description: The user password.
 *               role:
 *                 description: The user roles.
 *                 type: object
 *                 properties:
 *                   reviewer:
 *                     type: integer
 *                   referent:
 *                     type: integer
 *                   admin:
 *                     type: integer
 *             required:
 *               - email
 *               - password
 *   put:
 *     summary: Updates multiple users. [Privileged route]
 *     description: This methods allows to update multiple users.
 *     tags:
 *       - Users
 *     parameters:
 *       - in: query
 *         name: community
 *         schema:
 *           type: string
 *         description: The related community name.
 *       - in: query
 *         name: ids
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *           minItems: 1
 *         style: form
 *         explode: false
 *         description: A list of user IDs separated by a coma.
 *         example: id1,id2,id3,id4
 *       - $ref: '#/components/parameters/groupParam'
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: When type is set to its only value `senior`, we are updating users as reviewers for the Senior Expert programme.
 *   delete:
 *     summary: Delete multiple users. [Privileged route]
 *     description: This method allows to delete multiple users.
 *     tags:
 *       - Users
 *     parameters:
 *       - in: query
 *         name: ids
 *         required: true
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *           minItems: 1
 *         style: form
 *         explode: false
 *         description: A list of user IDs separated by a coma.
 *         example: id1,id2,id3,id4
 */
router.route('/')
    .all(accessControl.requiresRoles('referent', 'admin'))

    .get(validate(paramValidation.getUsers), userCtrl.list)
    .post(validate(paramValidation.createUser), userCtrl.create)
    .put(validate(paramValidation.updateUsers), userCtrl.updateUsers)
    .delete(validate(paramValidation.removeUsers), userCtrl.removeUsers);

/**
 * @openapi
 * /users/{userId}:
 *   get:
 *     summary: Gets a user
 *     description: This methods retrieves a user.
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID as set in MongoDB. <mongoose.Schema.Types.ObjectId>.
 *   put:
 *     summary: Updates a user.
 *     description: This methods allows to update a user.
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID as set in MongoDB. <mongoose.Schema.Types.ObjectId>.
 *       - in: query
 *         name: community
 *         schema:
 *           type: string
 *         description: The related community name.
 *       - $ref: '#/components/parameters/groupParam'
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: When type is set to its only value `senior`, we are updating a user as a reviewer or referent for the Senior Expert programme.
 *   delete:
 *     summary: Deletes a user.
 *     description: This method allows to delete a user.
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID as set in MongoDB. <mongoose.Schema.Types.ObjectId>.
 */
router.route('/:userId')
/* only the user or role >= Reviewer can access these routes */
    .all(function(req, res, next) {
      if (req.params.userId == req.session.user.id) {
        next();
      } else {
        if (req.method == 'GET') {
          accessControl.requiresRoles('reviewer', 'referent', 'admin')(req, res, next);
        } else {
          accessControl.requiresRoles('referent', 'admin')(req, res, next);
        }
      }
    })

    .get(userCtrl.get)

/* PUT /api/users/:userId - Update user */
/* req.body = {any subset of all the User model attributes for Referent; remove sensitive fields for user} */
/* PUT /api/users/:userId?community=Software&role=Reviewer(| Referent | Applicant) to update a user as reviewer or referent */
    .put(validate(paramValidation.updateUser), userCtrl.update)

    .delete(userCtrl.remove);

/**
 * @openapi
 * /users/{userId}/history:
 *   get:
 *     summary: Gets the history of applications created by a user.
 *     description: This method retrieves the history of application forms
 *       created by a user (identified by the `userId` parameter in the URL).
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID as set in MongoDB. <mongoose.Schema.Types.ObjectId>.
 *   post:
 *     summary: Creates a new entry in the history list of user's form applications.
 *     description: This method creates a new application entry in the user's history
 *       of applications his/her has created until now.
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID as set in MongoDB. <mongoose.Schema.Types.ObjectId>.
  *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: When type is set to its only value `senior`, we are creating a Senior Expertise application.
 *     requestBody:
 *       description: Info to create a new entry into the application history for the user.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               community:
 *                 type: string
 *                 description: The community name.
 *               communityId:
 *                 type: string
 *                 description: The community ID as set in MongoDB. <mongoose.Schema.Types.ObjectId>.
 *               formType:
 *                 type: string
 *                 enum: [new, renew, new-senior, renew-senior]
 *                 description: The application type (new or renewal application).
 *   put:
 *     summary: Updates the last user's application.
 *     description: This method updates the last user application form (stored in the user history list).
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID as set in MongoDB. <mongoose.Schema.Types.ObjectId>.
 *       - in: query
 *         name: community
 *         schema:
 *           type: string
 *         description: The community ID as set in MongoDB. <mongoose.Schema.Types.ObjectId>.
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: When type is set to its only value `senior`, we are updating a Senior Expertise application.
 *     requestBody:
 *       description: Info to create a new entry into the application history for the user.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               community:
 *                 type: string
 *                 description: The community name.
 *               communityId:
 *                 type: string
 *                 description: The community ID as set in MongoDB. <mongoose.Schema.Types.ObjectId>.
 *               formType:
 *                 type: string
 *                 enum: [new, renew, new-senior, renew-senior]
 *                 description: The application type (new or renewal application).
 *               status:
 *                 type: string
 *                 enum: [preparing, writing, submitted, accepted, withdrew, refused]
 *                 description: The status of the application.
 *               info:
 *                 type: string
 *                 description: Info/notes related to the application.
 *               formId:
 *                 type: string
 *                 description: The application form ID as set in the MongoDB forms collection. <mongoose.Schema.Types.ObjectId>.
 *   delete:
 *     summary: Deletes the last user's application.
 *     description: This method deletes the last user's application form.
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID as set in MongoDB. <mongoose.Schema.Types.ObjectId>.
 */
router.route('/:userId/history')
/* only the user or role >= Referent can access these routes */
    .all(function(req, res, next) {
      /* Only the applicant user, admins (no matter with the community), and referents in the same community can create */
      // TO IMPROVE HERE with role.admin = 127 for super admin
      if (req.session.user.role.admin != 0) {
        next();
      } else if (req.params.userId == req.session.user.id) {
        next();
      } else {
        if (req.body.communityId) {
          Community.get(req.body.communityId)
              .then((community) => {
                req.community = community;
                accessControl.requiresRolesInsideCommunity('referent', 'admin')(req, res, next);
              })
              .catch((e) => res.status(403).json({success: false, message: 'Forbidden.'}));
        } else {
          accessControl.requiresRoles('referent', 'admin')(req, res, next);
        }
      }
    })

    .get(userCtrl.getUserHistory)
    .post(canSubmitAppForms, validate(paramValidation.createNewUserApplication), userCtrl.createNewUserApplication)
    .put(canSubmitAppForms, validate(paramValidation.updateLastUserApplicationWithCommunityId), userCtrl.updateLastUserApplicationWithCommunityId)
    .delete(userCtrl.removeLastUserApplication);


module.exports = router;
