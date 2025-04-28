'use strict';

const express = require('express');

const config = require('../../config/config');
const contactRoutes = require('./contact.route.js');
const authRoutes = require('./auth.route');
const userRoutes = require('./user.route');
const formRoutes = require('./form.route');
const reviewRoutes = require('./review.route');
const communityRoutes = require('./community.route');
const formwizardRoutes = require('./form-wizard.route');
const uploadRoutes = require('./upload.route');
const phantomRoutes = require('./phantom.route');


const router = express.Router();

/**
 * API BASE URL
 * @openapi
 * /:
 *  get:
 *    summary: This is the API base URL.
 *    description: Welcome to OEMA REST API!
 *    tags:
 *      - API /
 *    responses:
 *      200:
 *        description: Returns a welcome string!
 */
router.get('/', (req, res) =>
  res.send(`Welcome! The RESTful API is at ${config.baseURL}:${config.port}/api (${config.env} environment)`),
);

/**
 * @openapi
 * /hello:
 *  get:
 *    summary: Checks service health.
 *    description: Say hello to check service health!
 *    tags:
 *      - API /hello
 *    responses:
 *      200:
 *        description: API is OK!
 */
router.get('/hello', (req, res) =>
  res.send('RESTful API OK :)'),
);

/*
 * Mount contact routes at /api/contact
 */
router.use('/contact', contactRoutes);

/*
 * Mount auth routes at /api/auth
 */
router.use('/auth', authRoutes);

/*
 * Mount user routes at /api/users
 */
router.use('/users', userRoutes);

/*
 * Mount form routes at /api/forms
 */
router.use('/forms', formRoutes);

/*
 * Mount review routes at /api/reviews
 */
router.use('/reviews', reviewRoutes);

/*
 * Mount community routes at /api/communities
 */
router.use('/communities', communityRoutes);

/*
 * Mount formwizards routes at /api/formwizards
 */
router.use('/formwizards', formwizardRoutes);

/*
 * Mount upload routes at /api/upload
 */
router.use('/upload', uploadRoutes);

/*
 * Mount phantom routes at /api/phantom
 */
router.use('/phantomjs', phantomRoutes);

/**
 * @swagger
 * components:
 *   schemas:
 *     ApiResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: A boolean value for success (true) or failure (false).
 *           example: true
 *         message:
 *           type: string
 *           description: A message providing a brief description of the response.
 *           example: Action performed successfully
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The user ID in MongoDB. <mongoose.Schema.Types.ObjectId>.
 *         email:
 *           type: string
 *           description: The user email.
 *         cuid:
 *           type: string
 *           description: The user CUID.
 *           example: aceg2468
 *         role:
 *           type: string
 *           description: The user role.
 *           enum: [Applicant, Reviewer, Referent, Admin]
 *         account:
 *           type: string
 *           description: The status of the user account.
 *           enum: [pending, active, inactive, suspended, enabled]
 *         firstname:
 *           type: string
 *           description: The user firstname.
 *         lastname:
 *           type: string
 *           description: The user lastname.
 *         gender:
 *           type: string
 *           description: "'Male', 'Female', 'N/A'"
 *           enum: [Male, Female, N/A]
 *         birthday:
 *           type: string
 *           description: The user birthday.
 *         phone:
 *           type: string
 *           description: The user phone number.
 *         classification:
 *           type: string
 *           description: The user classification.
 *         entity:
 *           type: string
 *           description: The user entity.
 *         location:
 *           type: string
 *           description: The city where the user works.
 *         country:
 *           type: string
 *           description: The country where the user works.
 *         managerFirstname:
 *           type: string
 *           description: Firstname of the user manager.
 *         managerLastname:
 *           type: string
 *           description: Lastname of the user manager.
 *         managerEmail:
 *           type: string
 *           description: Email address of the user manager.
 *         hrFirstname:
 *           type: string
 *           description: Firstname of the Human Resource contact for the user.
 *         hrLastname:
 *           type: string
 *           description: Lastname of the Human Resource contact for the user.
 *         hrEmail:
 *           type: string
 *           description: Email address of the Human Resource contact for the user.
 *         directoryUrl:
 *           type: string
 *           description: URL of the user profile in the Intranet directory.
 *         community:
 *           type: string
 *           description: The community in which the user is an expert, Reviewer or Referent (or Applicant if any)
 *         history:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/UserApp'
 *           description: History of all the user applications (submitted or not).
 *         lastLogin:
 *           type: string
 *           description: The last time when the user logged in.
 *           example: 2021-03-04T07:11:02.915Z
 *         createdAt:
 *           type: string
 *           description: The date when the user created his/her account.
 *           example: 2017-08-26T12:26:31.853Z
 *     UserApp:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The ID as set in MongoDB. <mongoose.Schema.Types.ObjectId>.
 *         community:
 *           type: string
 *           description: The full name of the community in which the user applies for an Expert position.
 *         communityId:
 *           type: string
 *           description: The community ID as set in MongoDB. <mongoose.Schema.Types.ObjectId>.
 *         formType:
 *           type: string
 *           description: The type of the application (new or renewal application)
 *           enum: [new, renew]
 *           default: 'new'
 *         formId:
 *           type: string
 *           description: The application form ID as set in MongoDB. <mongoose.Schema.Types.ObjectId>.
 *         status:
 *           type: string
 *           description: The status of the application.
 *           enum: [preparing, writing, submitted, accepted, withdrew, refused]
 *           default: 'preparing'
 *         year:
 *           type: integer
 *           description: The year of the recruitment period + 1.
 *             This means the first year of the mandate for the Expert position.
 *             <br>For example, if the recruitment period is in 2019, the value is 2020.
 *           example: 2020
 *         submittedAt:
 *           type: string
 *           description: The date when the user submitted his/her application.
 *             Or null if not submitted.
 *         info:
 *           type: string
 *           description: Some notes about this application. Or null if not available
 *   parameters:
 *     groupParam:
 *       name: group
 *       in: query
 *       description: The query parameter *group* identifies the programme.
 *         The possible values are "orange-experts", "senior-orange-experts", "experts-dtsi", "security-school".
 *       required: true
 *       schema:
 *         type: string
 *         enum: [orange-experts, senior-orange-experts, experts-dtsi, security-school]
 *
 */


module.exports = router;
