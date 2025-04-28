'use strict';

const express = require('express');
const fileUpload = require('express-fileupload');

const validate = require('../../config/validation/schema-validator');
const paramValidation = require('../../config/validation/upload-params.validation');
const uploadCtrl = require('../controllers/upload.controller');
const accessControl = require('../policies/access-control.policy');


const router = express.Router();

router.use(fileUpload(), accessControl.isAuthorized);

/*
 * Load community when API with communityId route parameter is hit.
 */
router.param('communityId', uploadCtrl.loadCommunity);

/**
 * @openapi
 * /upload:
 *   get:
 *     summary: Gets a file.
 *     description: This method retrieves a file by its filename
 *     tags:
 *       - Upload
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: The name of the file.
 *   post:
 *     summary: Upload a file to the server.
 *     description: This method allows to upload a file to the server.
 *       This is used to enclose assets (CV, recommendation letter, etc) into an application.
 *     tags:
 *       - Upload
 *     responses:
 *       200:
 *         description: The response contains the message
 *           `Successfully saved new file <filename>.`
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: The response contains the message
 *           `File not found!`
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.route('/')
    .post(validate(paramValidation.createFile), uploadCtrl.create);

/**
 * @openapi
 * /upload/{filename}:
 *   get:
 *     summary: Gets a file.
 *     description: This method retrieves a file by its filename
 *     tags:
 *       - Upload
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: The name of the file.
 */
router.get('/:filename', validate(paramValidation.checkFilenameParam), uploadCtrl.read);

/**
 * @openapi
 * /upload/aws:
 *   get:
 *     summary: Downloads a file from Amazon AWS S3.
 *     description: This method retrieves a file by its filename
 *       (set as a query parameter in the URL) from Amazon AWS S3.
 *     tags:
 *       - Upload
 *     parameters:
 *       - in: query
 *         name: file
 *         required: true
 *         schema:
 *           type: string
 *         description: The name of the file.
 *   post:
 *     summary: Uploads a file to Amazon AWS S3.
 *     description: This method allows to upload a file to Amazon AWS S3.
 *       This is used for uploading large files such as videos.
 *     tags:
 *       - Upload
 *     responses:
 *       200:
 *         description: The response contains the file URL
 *           returned by AWS S3.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: The response contains the message
 *           `File not found!`
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *   delete:
 *     summary: Deletes a file from Amazon AWS S3.
 *     description: This method allows to delete a file by its filename
 *       (set as a query parameter in the URL) from Amazon AWS S3.
 *     tags:
 *       - Upload
 *     parameters:
 *       - in: query
 *         name: file
 *         required: true
 *         schema:
 *           type: string
 *         description: The name of the file.
 */
router.route('/aws')
    .get(function(req, res, next) {
      if (req.query.user == req.session.user.id) {
        next();
      } else {
        accessControl.requiresRoles('reviewer', 'referent', 'admin')(req, res, next);
      }
    }, validate(paramValidation.getS3File), uploadCtrl.downloadS3)
    .post(validate(paramValidation.createFile), uploadCtrl.uploadS3)
    .delete(function(req, res, next) {
      if (req.query.user == req.session.user.id) {
        next();
      } else {
        accessControl.requiresRoles('referent', 'admin')(req, res, next);
      }
    }, validate(paramValidation.getS3File), uploadCtrl.removeS3);
/**
 * @openapi
 * /upload/{userId}/{filename}:
 *   get:
 *     summary: Gets a file.
 *     description: This method retrieves a file by its filename
 *       (set as a parameter in the URL) from the user
 *       (identified by the `userId` parameter in the URL).
 *     tags:
 *       - Upload
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID (as as set in MongoDB) of the user who owns the file.
 *           <mongoose.Schema.Types.ObjectId>.
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: The name of the file.
 *   delete:
 *     summary: Deletes a file.
 *     description: This method allows to delete a file by its filename
 *       (set as a parameter in the URL) from the user
 *       (identified by the `userId` parameter in the URL).
 *     tags:
 *       - Upload
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID (as as set in MongoDB) of the user who owns the file.
 *           <mongoose.Schema.Types.ObjectId>.
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: The name of the file.
 */
router.route('/:userId/:filename')
    .all(validate(paramValidation.checkUserFilenameParam))

    .get(function(req, res, next) {
      if (req.params.userId == req.session.user.id) {
        next();
      } else {
        accessControl.requiresRoles('reviewer', 'referent', 'admin')(req, res, next);
      }
    }, uploadCtrl.read)
    .delete(function(req, res, next) {
      if (req.params.userId == req.session.user.id) {
        next();
      } else {
        accessControl.requiresRoles('referent', 'admin')(req, res, next);
      }
    }, uploadCtrl.remove);


/**
 * @openapi
 * /upload/archive/community/{communityId}/forms:
 *   get:
 *     summary: Gets a zip archive of one or several applications.
 *     description: This methods allows to create a zip archive of an application
 *       for a community (identified by its ID as set in the `communityId` parameter in the URL).
 *       The archive includes the application form as well as all the assets
 *       (CV, recommendation letter by the manager, etc).
 *       It is also possible to archive several applications together
 *       by adding several application form IDs (separated by coma) into the query parameter `ids`.
 *     tags:
 *       - Upload
 *     parameters:
 *       - in: path
 *         name: communityId
 *         required: true
 *         schema:
 *           type: string
 *         description: The community ID as set in MongoDB. <mongoose.Schema.Types.ObjectId>.
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
 *         description: A list of application form IDs separated by a coma.
 *         example: id1,id2,id3,id4
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: When type is set to its only value `senior`, this means that we only want Senior Expertise application forms in the archive.
 *       - $ref: '#/components/parameters/groupParam'
 */
router.get('/archive/community/:communityId/forms', function(req, res, next) {
  // TO IMPROVE HERE with role.admin = 127 for super admin
  if (req.session.user.role.admin != 0) {
    next();
  } else if (req.query.uid && req.query.uid == req.session.user.id) {
    next();
  } else {
    accessControl.requiresRolesInsideCommunity('reviewer', 'referent', 'admin')(req, res, next);
  }
}, validate(paramValidation.formArchive), uploadCtrl.formArchive);


module.exports = router;
