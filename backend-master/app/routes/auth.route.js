'use strict';

const express = require('express');
const passport = require('passport');
const disposable = require('disposable-email');
const {v4: uuidv4} = require('uuid');

const config = require('../../config/config');
const validate = require('../../config/validation/schema-validator');
const paramValidation = require('../../config/validation/auth-params.validation');
const User = require('../models/user');
const authCtrl = require('../controllers/auth.controller');
const accessControl = require('../policies/access-control.policy');


const router = express.Router();

/**
 * @openapi
 * /auth/register:
 *  post:
 *    summary: Registers a new user.
 *    description: This method allows a user to create a new account.
 *    tags:
 *      - Auth
 *    parameters:
 *      - $ref: '#/components/parameters/groupParam'
 *    requestBody:
 *      description: User-entered data to create an account.
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              email:
 *                type: string
 *                description: The user's email.
 *                example: jane.doe@example.com
 *              password:
 *                type: string
 *                description: The user's password in plain text.
 *                example: Br31zH@22
 *    responses:
 *      200:
 *        description: The response contains the message
 *          `Successfully created new user.`
 *          <br>Note that the user will then receive a mail after registration
 *          which contains an activation URL to click to create his/her account.
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/ApiResponse'
 */
router.route('/register')
    .post(validate(paramValidation.register), function(req, res, next) {
      if (disposable.validate(req.body.email)) {
        next();
      } else {
        res.status(401).json({success: false, message: 'Not authorized.'});
      }
    }, authCtrl.register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Enables a user to be authenticated.
 *     description: This method returns a JWT access token if the user provides correct email and password.
 *     tags:
 *       - Auth
 *     parameters:
 *       - $ref: '#/components/parameters/groupParam'
 *     requestBody:
 *       description: User logs in with his/her email and password.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: The user's email.
 *                 example: jane.doe@example.com
 *               password:
 *                 type: string
 *                 description: The user's password in plain text.
 *                 example: Br31zH@22
 *               keepalive:
 *                 type: boolean
 *                 description: This options allows to keep the authentication session persistent (i.e. not to sign out on user inactivity).
 *                 default: false
 *     responses:
 *       200:
 *         description: The response contains info about the authenticated user,
 *           mainly his/her role (Applicant, Reviewer, Referent or Admin) and the JWT access token.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Boolean value - `true` for HTTP 200.
 *                   example: true
 *                 id:
 *                   type: string
 *                   description: An ID that uniquely identify the user.
 *                   example: 50b368f730ab9b005fc47cda
 *                 message:
 *                   type: string
 *                   description: A message providing the user's role and the access token.
 *                   example: Referent eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 policy:
 *                   type: boolean
 *                   description: Boolean value to indicate whether the user has accepted the privacy policy.
 *                   example: true
 */
router.route('/login')
    .post(validate(paramValidation.login),
        authCtrl.login);

if (config.env === 'production') {
  /**
   * @openapi
   * /auth/login/oidc:
   * get:
   *    summary: Sign in with Orange Connect.
   *    description: This method allows a user to sign in or sign up with Orange Connect.
   *    tags:
   *      - Auth
   *    responses:
   *      302:
   *        description: Redirection to Orange Connect Authorization endpoint.
   */
  router.route('/login/oidc')
      .get(passport.authenticate('orange_connect'));

  /**
   * Callback for the Orange Connect redirection URI
   */
  router.route('/oidc')
      .get(passport.authenticate('orange_connect', {successRedirect: '/', failureRedirect: '/nothing'}));

  /**
   * @openapi
   * /auth/oidc/userinfo:
   *   get:
   *     summary: Retrieves user info after signing in with Orange Connect.
   *     description: This method is used to get user info when signing in with Orange Connect.
   *     tags:
   *       - Auth
   *     parameters:
   *       - $ref: '#/components/parameters/groupParam'
   *     responses:
   *       200:
   *         description: The response contains info about the authenticated user,
   *           mainly his/her role (Applicant, Reviewer, Referent or Admin) and the access token.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   description: Boolean value - `true` for HTTP 200.
   *                   example: true
   *                 id:
   *                   type: string
   *                   description: An ID that uniquely identify the user.
   *                   example: 50b368f730ab9b005fc47cda
   *                 message:
   *                   type: string
   *                   description: A message providing the user's role, the Orange Connect access token, the user's email and name.
   *                   example: Referent eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9 john.doe@orange.com username
   *                 policy:
   *                   type: boolean
   *                   description: Boolean value to indicate whether the user has accepted the privacy policy.
   *                   example: true
   */
  router.route('/oidc/userinfo')
      .get(validate(paramValidation.getOidcUserInfo),
          (req, res, next) => {
            if (!req.session['jwt_token'] && req.user) {
            // User has just signed in with Orange Connect, but has no account.
              next();
            } else {
              res.status(401).json({success: false, message: 'Unauthorized'});
            }
          },
          (req, res, next) => {
            req.session.group = req.query.group;
            const savedUser = req.user;
            if (savedUser) {
              let userRole = 'Applicant';
              if (savedUser.role) {
                if ((savedUser.role.admin & config[req.query.group].communitiesGroupFlag) != 0) {
                  userRole = 'Admin';
                } else if ((savedUser.role.referent & config[req.query.group].communitiesGroupFlag) != 0) {
                  userRole = 'Referent';
                } else if ((savedUser.role.reviewer & config[req.query.group].communitiesGroupFlag) != 0) {
                  userRole = 'Reviewer';
                } else {
                  userRole = 'Applicant';
                }
              }

              res.json({
                success: true,
                id: savedUser.id,
                message: `${userRole} ${savedUser.access_token} ${savedUser.email} ${savedUser.firstname || ''}`,
                policy: savedUser.policy,
              });
            } else {
              res.status(401).json({
                success: false,
                message: 'Unexpected error!',
              });
            }
          });

  /**
   * @openapi
   * /auth/oidc/create:
   *   post:
   *     summary: Creates a new user account after signing in with Orange Connect.
   *     description: This method allows a user to create his/her account when signing in with Orange Connect.
   *     tags:
   *       - Auth
   *     requestBody:
   *       description: User email to create an account. No password.
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               email:
   *                 type: string
   *                 description: The user's email.
   *                 example: jane.doe@example.com
   *     responses:
   *       200:
   *         description: Response for successful account creation.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiResponse'
   *       400:
   *         description: Bad request, the account is not created.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiResponse'
   *       500:
   *         description: Internal server error, the account is not created.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiResponse'
   */
  router.route('/oidc/create')
      .post(validate(paramValidation.createOidcAccount),
          (req, res, next) => {
            if (!req.session['jwt_token'] && req.user && req.user.id === '-1') {
            // User has just signed in with Orange Connect, but has no account.
              next();
            } else {
              res.status(401).json({success: false, message: 'Unauthorized'});
            }
          },
          (req, res, next) => {
            if (req.user.id === '-1' && req.user.email === req.body.email) {
            // Create new user account
              const newUser = new User({
                email: req.user.email,
                firstname: req.user.firstname,
                lastname: req.user.lastname,
                password: uuidv4(),
                account: 'active',
                acceptPolicy: true,
                role: {
                  reviewer: 0,
                  referent: 0,
                  admin: 0,
                },
              });
              newUser.save()
                  .then((user) => {
                    // Update passport session for Orange Connect
                    req.session.passport.user.id = user.id;
                    req.session.passport.user.policy = true;

                    res.json({
                      success: true,
                      message: 'Successfully created your account!',
                    });
                  })
                  .catch((_) => {
                    res.status(500).json({
                      success: false,
                      message: 'Unexpected error! We can\'t create an account for you.',
                    });
                  });
            } else {
              res.status(400).json({
                success: false,
                message: 'Very bad, you failed!',
              });
            }
          });

  /**
   * @openapi
   * /auth/oidc/recover:
   *   post:
   *     summary: Sends a mail to let a user recover his/her account for Orange Connect migration.
   *     description: This method allows a user to change his/her account email address for the one associated with Orange Connect.
   *     tags:
   *       - Auth
   *     parameters:
   *       - $ref: '#/components/parameters/groupParam'
   *     requestBody:
   *       description: User enters his/her address for getting an email with the account modification URL.
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               email:
   *                 type: string
   *                 description: The user's email.
   *                 example: jane.doe@example.com
   *     responses:
   *       200:
   *         description: The response contains the message
   *           `Successfully sent email for account recovery.`
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiResponse'
   */
  router.route('/oidc/recover')
      .post(validate(paramValidation.recoverOidcAccount),
          (req, res, next) => {
            if (!req.session['jwt_token'] && req.user && req.user.id === '-1') {
            // User has just signed in with Orange Connect,
            // but wants to recover his/her account created with another email address.
              next();
            } else {
              res.status(401).json({success: false, message: 'Unauthorized'});
            }
          },
          authCtrl.sendAccountRecoveryEmail);

  /**
   * @openapi
   * /auth/oidc/recover/{token}:
   *   post:
   *     summary: Changes the user email.
   *     description: Given the token received in the mail to recover the account after signing in with Orange Connect,
   *       this method allows a user to change his/her account email.
   *     tags:
   *       - Auth
   *     parameters:
   *       - in: path
   *         name: token
   *         required: true
   *         schema:
   *           type: string
   *         description: The token displayed in the URL in the received mail for changing account email.
   *     responses:
   *       200:
   *         description: The response contains info about the user account,
   *           mainly his/her role (Applicant, Reviewer, Referent or Admin) and the access token.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   description: Boolean value - `true` for HTTP 200.
   *                   example: true
   *                 id:
   *                   type: string
   *                   description: An ID that uniquely identify the user.
   *                   example: 50b368f730ab9b005fc47cda
   *                 message:
   *                   type: string
   *                   description: A message providing the user's role, the Orange Connect access token, the user's email and name.
   *                   example: Referent eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9 john.doe@orange.com username
   *                 policy:
   *                   type: boolean
   *                   description: Boolean value to indicate whether the user has accepted the privacy policy.
   *                   example: true
   */
  router.put('/oidc/recover/:token',
      validate(paramValidation.changeOidcAccountEmail),
      (req, res, next) => {
        if (!req.session['jwt_token'] && req.user && req.user.id === '-1') {
          // User has just signed in with Orange Connect,
          // but wants to recover his/her account created with another email address.
          next();
        } else {
          res.status(401).json({success: false, message: 'Unauthorized'});
        }
      },
      authCtrl.changeOidcAccountEmail);
}

/**
 * @openapi
 * /auth/activate/{token}:
 *   get:
 *     summary: Activates the user account.
 *     description: This method activates the account creation when the user clicks on the link in the mail received after resgistration.
 *     tags:
 *       - Auth
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: The token received after registration.
 *     responses:
 *       200:
 *         description: The response contains the message
 *           `Successfully activated the account of user ${user.email}.`
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.route('/activate/:token')
    .get(validate(paramValidation.activateAccount), authCtrl.activateAccount);

/**
 * @openapi
 * /auth/logout:
 *   delete:
 *     summary: Logs the user out.
 *     description: This methods lets the user log out.
 *     tags:
 *       - Auth
 *     responses:
 *       200:
 *         description: The response contains the message
 *           `Successfully logged user ${user.email} out.`.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.route('/logout')
    .delete(accessControl.isAuthorized, authCtrl.logout);

/**
 * @openapi
 * /auth/profile:
 *   get:
 *     summary: Retrieves the user profile.
 *     description: This method allows the user to get his/her profile.
 *     tags:
 *       - Auth
 *     parameters:
 *       - $ref: '#/components/parameters/groupParam'
 *     responses:
 *       200:
 *         description: A JSON object which describes the user profile.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */
router.route('/profile')
    .get(accessControl.isAuthorized, validate(paramValidation.getProfile), authCtrl.profile);

/**
 * @openapi
 * /auth/passwd:
 *   post:
 *     summary: Sends a mail to reset the user password.
 *     description: This method allows the user to get an email with a URL to reset his/her password.
 *     tags:
 *       - Auth
 *     parameters:
 *       - $ref: '#/components/parameters/groupParam'
 *     requestBody:
 *       description: User enters his/her address for getting a mail with the password reset URL.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: The user's email.
 *                 example: jane.doe@example.com
 *     responses:
 *       200:
 *         description: The response contains the message
 *           `Successfully sent email for password recovery.`
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.post('/passwd', validate(paramValidation.requestPasswdChange),
    authCtrl.sendPasswordResetEmail);

/**
 * @openapi
 * /auth/passwd/{token}:
 *   post:
 *     summary: Changes the user password.
 *     description: Given the token received in the mail to reset the password, this method allows the user to change his/her password.
 *     tags:
 *       - Auth
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: The token displayed in the URL in the received mail for changing password.
 *     requestBody:
 *       description: The new password that the user has entered.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *                 description: The new user's password.
 *     responses:
 *       200:
 *         description: The response contains the message
 *           `Successfully changed password.`
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.post('/passwd/:token', validate(paramValidation.resetPasswd), authCtrl.resetPassword);

/**
 * @openapi
 * /auth/cansubmitforms:
 *   get:
 *     summary: Checks if application submission is closed or a user can submit an application form.
 *     description: This methods ensures that either application submission is closed,
 *       or a user is authorized to submit a form (regarding only the deadline of recruitment period).
 *     parameters:
 *       - $ref: '#/components/parameters/groupParam'
 *       - in: query
 *         name: user
 *         schema:
 *           oneOf:
 *             - type: string
 *             - type: integer
 *         description: (Optional) Either the user ID or 1.
 *           <br>• When the `user` query parameter is not present,
 *           the request only checks that application submission is closed for everyone
 *           (deadline is reached).
 *           <br>• When the `user` query parameter is present and equal to 1, the request checks
 *           if the connected user can submit an application form.
 *           If deadline for submission is reached (this means application submission is closed for everyone),
 *           the user may benefit from an additional delay to submit his/her application.
 *           <br>• When the `user` query parameter is present and is a hexa ID, the request checks
 *           if the user identified by this ID can submit an application form. This request is used by
 *           Referents or Admins to manage the additional delay granted to the user for submission.
 *     tags:
 *       - Auth
 *     responses:
 *       200:
 *         description: The response contains the message
 *           `OK` or `KO`. The *state* indicates if application submission is globally closed for everyone.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     state:
 *                       type: integer
 */
router.route('/cansubmitforms')
    .get(accessControl.isAuthorized, validate(paramValidation.canSubmitForms), authCtrl.canSubmitForms);

/**
 * @openapi
 * /auth/openCloseSubmission:
 *   put:
 *     summary: Opens or closes application submission. [Privileged route]
 *     description: This method allows Referents or Admins to
 *       open or close application submission globally (for everyone), or only for one user.
 *     tags:
 *       - Auth
 *     parameters:
 *       - $ref: '#/components/parameters/groupParam'
 *       - in: query
 *         name: user
 *         schema:
 *           oneOf:
 *             - type: string
 *             - type: integer
 *         description: (Optional) The user ID.
 *       - in: query
 *         name: usermail
 *         schema:
 *           type: string
 *         description: (Optional) The user email address.
 *     requestBody:
 *       description: Open (state = 1) or close (state = 0) application submission.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               state:
 *                 type: integer
 *                 description: state = 1 => open<br>state = 0 => close
 *     responses:
 *       200:
 *         description: The response contains a confirmation message.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     state:
 *                       type: integer
 */
router.route('/openclosesubmission')
    .put(accessControl.isAuthorized, accessControl.requiresRoles('referent', 'admin'),
        validate(paramValidation.openCloseSubmission), authCtrl.openCloseSubmission);

/**
 * @openapi
 * /auth/latecomers:
 *   get:
 *     summary: Lists latecomers for application submission. [Privileged route]
 *     description: This method lists the users who benefit from an additional delay to submit their application.
 *     tags:
 *       - Auth
 *     parameters:
 *       - $ref: '#/components/parameters/groupParam'
 *   delete:
 *     summary: Deletes latecomer(s). [Privileged route]
 *     description: This method removes the additional access delay for one or several latecomers.
 *     tags:
 *       - Auth
 *     parameters:
 *       - $ref: '#/components/parameters/groupParam'
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
router.route('/latecomers')
    .get(accessControl.isAuthorized, accessControl.requiresRoles('referent', 'admin'),
        validate(paramValidation.listLatecomers), authCtrl.listLatecomers)
    .delete(accessControl.isAuthorized, accessControl.requiresRoles('referent', 'admin'),
        validate(paramValidation.removeLatecomers), authCtrl.removeLatecomers);


module.exports = router;
