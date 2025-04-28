'use strict';

const express = require('express');

const validate = require('../../config/validation/schema-validator');
const paramValidation = require('../../config/validation/contact-params.validation');
const contactCtrl = require('../controllers/contact.controller');
const accessControl = require('../policies/access-control.policy');


const router = express.Router();

router.use(accessControl.isAuthorized);

/**
 * @openapi
 * /contact:
 *   post:
 *     summary: Sends a message to the admin.
 *     description: This method is used for the Contact page
 *       to send an email to the admin.
 *     tags:
 *       - Contact
 *     parameters:
 *       - $ref: '#/components/parameters/groupParam'
 *     requestBody:
 *       description: Message for the email to be sent.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 description: The user-entered message.
 *     responses:
 *       200:
 *         description: The response contains the message
 *           `Successfully sent email to the admin.`
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.route('/')
    .post(validate(paramValidation.contactAdmin), contactCtrl.contactAdmin);

/**
 * @openapi
 * /contact/users:
 *   post:
 *     summary: Sends an email to user(s). [Privileged route]
 *     description: This method is used by Reviewers, Referents or Admins
 *       to contact users by sending an email.
 *     tags:
 *       - Contact
 *     requestBody:
 *       description: Content related to the email to be sent to user(s).
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               recipients:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: The list of users' emails.
 *               from:
 *                 type: string
 *                 description: The sender email.
 *               ccemails:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: The list of CC emails.
 *               bccemails:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: The list of BCC emails.
 *               subject:
 *                 type: string
 *                 description: The email object.
 *               message:
 *                 type: string
 *                 description: The user-entered message.
 *     responses:
 *       200:
 *         description: The response contains the message
 *           `Successfully sent email to the user(s).`
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.route('/users')
    .post(accessControl.requiresRoles('reviewer', 'referent', 'admin'), validate(paramValidation.contactUsers), contactCtrl.contactUsers);


module.exports = router;
