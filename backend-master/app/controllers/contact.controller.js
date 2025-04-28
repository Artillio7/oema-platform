'use strict';

const nodemailer = require('nodemailer');
const httpStatus = require('http-status');
const APIError = require('../helpers/APIError');

const config = require('../../config/config');


/*
 * Send an email to admin
 */
function contactAdmin(req, res, next) {
  const smtpTransporter = nodemailer.createTransport(config.smtp);

  let mailFrom = config.mail.from;
  if (req.query.group === 'security-school') {
    mailFrom = config[req.query.group].adminMail;
  }

  const mailOptions = {
    to: req.query.group ? config[req.query.group].adminMail : config.mail.admin,
    from: mailFrom,
    subject: 'New contact message from OEMA',
    text: 'You have a message from ' +
    `${req.session.user.firstname || ''} ${req.session.user.lastname || ''} (${req.session.user.email}):\n\n${req.body.message}`,
  };

  smtpTransporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      const err = new APIError('Cannot send an email to the admin.', httpStatus.INTERNAL_SERVER_ERROR, true);
      return next(err);
    }

    res.json({success: true, message: 'Successfully sent email to the admin.'});
  });
}

/*
 * Send an email to users
 */
function contactUsers(req, res, next) {
  const smtpTransporter = nodemailer.createTransport(config.smtp);

  let mailFrom = config.mail.from;
  if (req.body.from) {
    mailFrom = req.body.from;
  } else if (req.query.group === 'security-school') {
    mailFrom = config[req.query.group].adminMail;
  }

  const mailOptions = {
    to: req.body.recipients,
    from: mailFrom, // req.body.from || config.mail.from,
    cc: req.body.ccemails || '',
    bcc: req.body.bccemails || '',
    subject: req.body.subject,
    text: req.body.message,
  };


  smtpTransporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      const err = new APIError('Cannot send an email to the user(s).', httpStatus.INTERNAL_SERVER_ERROR, true);
      return next(err);
    }

    res.json({success: true, message: 'Successfully sent email to the user(s).'});
  });
}


module.exports = {contactAdmin, contactUsers};
