'use strict';

const express = require('express');

const validate = require('../../config/validation/schema-validator');
const paramValidation = require('../../config/validation/phantom-params.validation');
const phantomCtrl = require('../controllers/phantom.controller');
const accessControl = require('../policies/access-control.policy');


const router = express.Router();

/**
 * @openapi
 * /phantomjs/{token}/form/{formId}/community/{communityId}/{formType}:
 *   get:
 *     summary: Renders the application form before pdf export by phantomjs.
 *     description: This method prepares the application for a PDF export.
 *     tags:
 *       - Phantomjs
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: The token to authenticate the phantom ;)
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
 *       - in: path
 *         name: formType
 *         required: false
 *         schema:
 *           type: string
 *           enum: [new, renew, new-senior, renew-senior]
 *         description: The form type.
 */
router.get('/:token/form/:formId/community/:communityId/:formType', validate(paramValidation.renderForm), phantomCtrl.renderForm);

/**
 * @openapi
 * /phantomjs/form/{formId}/community/{communityId}:
 *   get:
 *     summary: PDF export by phantomjs.
 *     description: This method returns an application/pdf blob URL
 *       to download the PDF export.
 *     tags:
 *       - Phantomjs
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
 *       - in: path
 *         name: formType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [new, renew, new-senior, renew-senior]
 *         description: The form type.
 *       - $ref: '#/components/parameters/groupParam'
 */
router.get('/form/:formId/community/:communityId/:formType', accessControl.isAuthorized, validate(paramValidation.pdfFormExport), phantomCtrl.pdfFormExport);


module.exports = router;
