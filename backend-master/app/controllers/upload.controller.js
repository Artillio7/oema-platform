'use strict';

const mongoose = require('mongoose');
const {Readable} = require('stream');
const archiver = require('archiver');
const aws = require('aws-sdk');
const {HttpsProxyAgent} = require('https-proxy-agent');
const httpStatus = require('http-status');

const generatePdf = require('../helpers/pdf.generator');
const JWT = require('../helpers/jwt.service');
const APIError = require('../helpers/APIError');

const config = require('../../config/config');
const Forms = require('../models/form');
const Community = require('../models/community');


// MongoDB GridFS
let gridFSBucket;
let FsFile;
const mongoUri = `${config.mongo.uri}`;
mongoose.createConnection(mongoUri);
const conn = mongoose.connection;
const mongoDriver = mongoose.mongo;
conn.once('open', () => {
  gridFSBucket = new mongoDriver.GridFSBucket(conn.db);
  const FileSchema = new mongoose.Schema({}, {strict: false});
  FsFile = mongoose.model('FsFile', FileSchema, 'fs.files');
});

// Amazon AWS S3
aws.config.update({region: 'us-east-1'});
const s3 = new aws.S3({
  accessKeyId: config.s3.accessKeyId,
  secretAccessKey: config.s3.secretAccessKey,
  endpoint: config.s3.endpoint,
  signatureVersion: 'v4',
  sslEnabled: true,
  s3ForcePathStyle: true,
  httpOptions: {
    agent: new HttpsProxyAgent('http://cs.pr-proxy.service.sd.diod.tech:3128'),
  },
});

/*
 * Load community and append to req.
 */
function loadCommunity(req, res, next, id) {
  Community.get(id)
      .then((community) => {
        req.community = community;
        next();
      })
      .catch((e) => next(e));
}

/*
 * Upload a file to the server
 * using Mongo GridFS for storage.
 */
function create(req, res, next) {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).json({success: false, message: 'File not found!'});
  }

  const part = req.files.filefield;
  // Remove white spaces and special characters like ç, é, à...
  // but keep - and _
  // to avoid issues with Mongo GridFS encoding.
  const filename = part.name.replace(/([^\w -.]|\s)/g, '');

  FsFile.findOne({filename}).exec()
      .then((file) => {
        if (file) {
          return gridFSBucket.delete(file['_id'])
              .then(() => {
                return 1;
              });
        } else {
          return 0;
        }
      })
      .then((_) => {
        // Covert buffer to Readable Stream
        const readableStream = new Readable();
        readableStream.push(part.data);
        readableStream.push(null);

        const uploadStream = gridFSBucket.openUploadStream(filename);
        readableStream.pipe(uploadStream);

        uploadStream.on('finish', () => {
          res.json({success: true, message: `Successfully saved new file ${part.name}.`});
        });

        uploadStream.on('error', (err) => {
          next(err);
        });
      })
      .catch((e) => next(e));
}

// Fix a breaking change with pdf names
async function getDownloadStreamByName(filename) {
  let fileExists = await FsFile.findOne({'filename': filename.replace(/([^\w -.]|\s)/g, '')});
  if (fileExists) {
    return gridFSBucket.openDownloadStreamByName(filename.replace(/([^\w -.]|\s)/g, ''));
  } else {
    fileExists = await FsFile.findOne({'filename': filename});
    if (fileExists) {
      return gridFSBucket.openDownloadStreamByName(filename);
    } else {
      return null;
    }
  }
}

/*
 * Retrieve a file to download.
 */
async function read(req, res, next) {
  if (req.query.exists) {
    const exists = await FsFile.findOne({'filename': req.params.filename});
    res.json({success: exists != null});
  } else {
    const downloadStream = await getDownloadStreamByName(req.params.filename);

    if (!downloadStream) {
      const notFound = new APIError('File not found.', httpStatus.NOT_FOUND, true);
      return next(notFound);
    }

    if (req.params.filename.endsWith('.doc')) {
      res.set('Content-Type', 'application/msword');
    } else if (req.params.filename.endsWith('.docx')) {
      res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    } else if (req.params.filename.endsWith('.pdf')) {
      res.set('Content-Type', 'application/pdf');
    }

    downloadStream.on('data', (chunk) => {
      res.write(chunk);
    });

    downloadStream.on('end', () => {
      res.end();
    });

    downloadStream.on('error', (err) => {
      next(err);
    });
  }
}

/*
 * Remove a file from the MongoDB GridFS.
 * This is a middleware for Express.
 */
function remove(req, res, next) {
  FsFile.findOne({'filename': req.params.filename.replace(/([^\w -.]|\s)/g, '')}).exec()
      .then((file) => {
        return gridFSBucket.delete(file['_id'])
            .then(() => res.json({success: true, message: `Successfully deleted the file ${req.params.filename}.`}));
      })
      .catch((e) => next(e));
}

/*
 * Remove a file from the MongoDB GridFS.
 * This is a helper function.
 */
function removeFileFromGridFS(filename) {
  FsFile.findOne({filename: filename.replace(/([^\w -.]|\s)/g, '')}).exec()
      .then((file) => gridFSBucket.delete(file['_id']))
      .catch((e) => console.log(e));
}

/*
 * Rename a file in the MongoDB GridFS.
 * This is a helper function.
 */
function renameFileGridFS(oldFilename, newFilename) {
  const oldName = oldFilename.replace(/([^\w -.]|\s)/g, '');
  FsFile.findOne({filename: oldName}).exec()
      .then((file) =>
        FsFile.updateOne({filename: oldName}, {$set: {filename: newFilename.replace(/([^\w -.]|\s)/g, '')}}))
      .catch((e) => console.log(e));
}

/*
 * Upload a file to Amazon AWS S3:
 * https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#upload-property
 */
function uploadS3(req, res, next) {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).json({success: false, message: 'File not found!'});
  }

  const part = req.files.filefield;

  const params = {
    Bucket: config.s3.bucket,
    Key: part.name,
    Body: part.data,
  };

  s3.upload(params).promise()
      .then((data) =>
        res.json({success: true, message: data.Location}),
      )
      .catch((e) => next(e));
}

/*
 * Retrieve a file from AWS S3:
 * https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#getObject-property
 */
function downloadS3(req, res, next) {
  const params = {
    Bucket: config.s3.bucket,
    Key: req.query.file,
  };

  res.attachment(req.query.file);
  const downloadStream = s3.getObject(params).createReadStream();

  downloadStream.on('data', (chunk) => {
    res.write(chunk);
  });

  downloadStream.on('end', () => {
    res.end();
  });

  downloadStream.on('error', (err) => {
    next(err);
  });
}

/*
 * Delete a file from AWS S3:
 * https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#deleteObject-property
 * This is a middleware for Express.
 */
function removeS3(req, res, next) {
  const params = {
    Bucket: config.s3.bucket,
    Key: req.query.file,
  };

  s3.deleteObject(params).promise()
      .then((data) =>
        res.json({success: true, message: `Successfully deleted the file ${req.query.file}.`}),
      )
      .catch((e) => next(e));
}

/*
 * Delete a file from AWS S3.
 * This is a helper function.
 */
function removeFileFromS3(filename) {
  const params = {
    Bucket: config.s3.bucket,
    Key: filename,
  };

  s3.deleteObject(params).promise()
      .catch((e) => console.log(e));
}

/*
 * Rename a file in AWS S3:
 * https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#copyObject-property
 * This is a helper function.
 */
function renameFileS3(oldFilename, newFilename) {
  s3.copyObject({
    Bucket: config.s3.bucket,
    CopySource: `${config.s3.bucket}/${oldFilename}`,
    Key: newFilename,
  }).promise()
      .then(() =>
        s3.deleteObject({
          Bucket: config.s3.bucket,
          Key: oldFilename,
        }).promise(),
      )
      .catch((e) => console.log(e));
}

/*
 * Get zip archive of application.
 */
function formArchive(req, res, next) {
  const ids = req.query.ids.split(',');

  res.contentType('application/zip');
  const zip = archiver('zip');
  zip.pipe(res);

  Community.findOne({'_id': req.params.communityId}).exec()
      .then((community) => {
        return Forms[req.query.type ? `Senior${community.label}` : community.label].find({
          '_id': {$in: ids.map(function(o) {
            return mongoose.Types.ObjectId.createFromHexString(o);
          })},
        }).exec()
            .then(async (forms) => {
              const token = JWT.createTokenFromEmail(req.session.user.email, '20m');
              let downloadStream;

              for (const form of forms) {
                const file = (config.env === 'development' ? config.frontBaseurl : config.baseURL.replace('backend', 'frontend') + ':4200') +
                `/${req.query.group}/application/thephantomroute/${token}/${form.id.toString()}` +
                `/${req.params.communityId}/${form.formType}${req.query.type ? '-senior' : '' }`;

                const pdf = await generatePdf(file);
                zip.append(pdf, {name: form.email + '/app-form.pdf'});

                if (form.userAnsweredForm['file-cv']) {
                  downloadStream = await getDownloadStreamByName((req.query.type ? 'Senior-' : '') +
                    req.params.communityId + '-' +
                    form.id.toString() + '-' + form.userAnsweredForm['file-cv']);
                  if (downloadStream) {
                    zip.append(downloadStream, {name: form.email + '/file-cv.pdf'});
                  }
                }

                if (form.userAnsweredForm['file-manager-recommendation']) {
                  downloadStream = await getDownloadStreamByName((req.query.type ? 'Senior-' : '') +
                    req.params.communityId + '-' +
                    form.id.toString() + '-' + form.userAnsweredForm['file-manager-recommendation']);
                  if (downloadStream) {
                    zip.append(downloadStream, {name: form.email + '/file-manager-approval.pdf'});
                  }
                }

                if (form.userAnsweredForm['file-orange-expert-charter']) {
                  downloadStream = await getDownloadStreamByName((req.query.type ? 'Senior-' : '') +
                    req.params.communityId + '-' +
                    form.id.toString() + '-' + form.userAnsweredForm['file-orange-expert-charter']);
                  if (downloadStream) {
                    zip.append(downloadStream, {name: form.email + '/file-orange-expert-charter.pdf'});
                  }
                }

                if (form.userAnsweredForm['other-documents-upload']) {
                  for (const storedFile of form.userAnsweredForm['other-documents-upload']) {
                    downloadStream = await getDownloadStreamByName((req.query.type ? 'Senior-' : '') +
                      req.params.communityId + '-' +
                      form.id.toString() + '-' + storedFile.name);
                    if (downloadStream) {
                      zip.append(downloadStream, {name: form.email + '/' + storedFile.name});
                    }
                  }
                }
              }

              zip.finalize();
            });
      })
      .catch((e) => next(e));
}


module.exports = {
  loadCommunity,
  create, read, remove, removeFileFromGridFS, renameFileGridFS,
  uploadS3, downloadS3, removeS3, removeFileFromS3, renameFileS3,
  formArchive,
};
