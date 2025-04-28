'use strict';

const express = require('express');
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const compress = require('compression');
const methodOverride = require('method-override');
const cors = require('cors');
const httpStatus = require('http-status');
const expressWinston = require('express-winston');
const Joi = require('joi');
const {doubleCsrf} = require('csrf-csrf');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const {RedisStore: RateLimitRedisStore} = require('rate-limit-redis');
const passport = require('passport');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUI = require('swagger-ui-express');

const config = require('./config');
const redisSessionClient = require('./redisConnection').getClient(0);
const redisRateLimitClient = require('./redisConnection').getClient(2);
const winstonInstance = require('./winston');
const routes = require('../app/routes/app.index.route');
const APIError = require('../app/helpers/APIError');


const app = express();

const sess = {
  store: new RedisStore({
    client: redisSessionClient,
    prefix: 'oemasess:',
    ttl: 172800,
  }),
  secret: config.sessionIdSecret,
  cookie: {
    sameSite: 'none',
    secure: config.env === 'production' ? true : false,
  },
  name: 'oemaId',
  resave: false, // required: force lightweight session keep alive (touch)
  saveUninitialized: false, // recommended: only save session when data exists
  unset: 'destroy',
};
if (config.env === 'production') {
  // Otherwise we fail to get tokens with Orange Connect.
  app.set('trust proxy', 1);
}
app.use(session(sess));

/*
 * Parse body params and attach them to req.body
 */
app.use(express.json({limit: '1mb'}));
app.use(express.urlencoded({extended: true}));

app.use(cookieParser(config.sessionIdSecret));
app.use(compress());
app.use(methodOverride());

/*
 * Secure the app by setting various HTTP headers.
 */
app.use(helmet());

/*
 * Enable CORS - Cross Origin Resource Sharing.
 * IMPORTANT HERE for CORS between front & back ; and also set withCredentials=true in Angular.
 */
const corsOptions = {
  origin: config.frontBaseurl,
  credentials: true,
};
app.use(cors(corsOptions));

/*
 * CSRF Middleware
 */
const {generateToken, doubleCsrfProtection} = doubleCsrf({
  getSecret: () => config.sessionIdSecret + '9f06243abcb89c70e0c331c61d871fa7',
  cookieName: '_csrf',
  getTokenFromRequest: (req) => req.headers['x-csrf-token'],
});
app.get('/api/csrf', (req, res) => {
  const csrfToken = generateToken(res, req);
  res.json({csrfToken});
});
app.use(doubleCsrfProtection);

/*
 * Passport middleware.
 */
/* As of v0.6.x, passport.initialize() is no longer necessary to use this middleware.  It
 * exists for compatiblity with apps built using previous versions of Passport,
 * in which this middleware was necessary.
 */
app.use(passport.initialize());
app.use(passport.session());

/*
 * Load the passport-jwt strategy for email+password login.
 */
require('./passport')(passport);

/*
 * Load the oidc strategy for Orange Connect.
 */
if (config.env === 'production') {
  require('./oidc')(passport);
}

/*
 * Enable detailed API logging in the dev environment.
 */
const routeBlacklist = [
  '/api/phantomjs/',
  '/api/upload/',
];

expressWinston.requestWhitelist.push('params', 'body', 'session', 'ip');
expressWinston.responseWhitelist.push('body');
if (config.env === 'development') {
  app.use(expressWinston.logger({
    winstonInstance,
    meta: true, // optional: log meta data about request (defaults to true)
    msg: 'HTTP {{req.method}} {{req.url}} {{res.statusCode}} {{res.responseTime}}ms',
    colorize: true, // Color the text and status code, using the Express/morgan color palette.
    ignoreRoute: function(req, res) {
      return routeBlacklist.findIndex((r) => req.path.includes(r)) !== -1;
    },
  }));

  // Use morgan to log requests to the console.
  app.use(morgan('dev'));
} else { // log in production
  app.use(expressWinston.logger({
    winstonInstance,
    meta: true, // optional: log meta data about request (defaults to true)
    msg: 'HTTP {{req.method}} {{req.url}} {{res.statusCode}} {{res.responseTime}}ms',
    bodyBlacklist: ['password'],
    ignoreRoute: function(req, res) {
      return routeBlacklist.findIndex((r) => req.path.includes(r)) !== -1;
    },
  }));
}

/*
 * Mount all API routes on the /api path.
 */
app.use('/api', routes);

/*
 * swagger-jsdoc
 * Generate an OpenAPI (Swagger) based documentation
 * only in the dev environment.
 */
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'OEMA API',
      version: '1.0.0',
      description: 'This is the REST API for the Orange Expertise Management Application.',
      contact: {
        name: 'Patrick Truong',
        email: 'patrick.truong@orange.com',
      },
    },
    servers: [
      {
        url: `http://127.0.0.1:${config.port}/api`,
        description: 'Development server',
      },
      {
        url: 'https://oswe-frontend-staging.apps.fr01.paas.tech.orange/api',
        description: 'Staging server',
      },
      {
        url: 'https://orange-expert-recruitment.apps.fr01.paas.diod.orange.com/api',
        description: 'Production server',
      },
    ],
  },
  // Paths to files containing OpenAPI definitions
  apis: ['./app/routes/*.js'],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/docs', swaggerUI.serve, swaggerUI.setup(swaggerSpec));

/*
 * Create and use the rate limiter
 */
const limiter = rateLimit({
  // Rate limiter configuration
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true,
  legacyHeaders: false,

  // Redis store configuration
  store: new RateLimitRedisStore({
    sendCommand: (...args) => redisRateLimitClient.sendCommand(args),
  }),
});
app.use(limiter);

/*
 * If error is not an instanceOf APIError, convert it.
 */
app.use((err, req, res, next) => {
  if (err instanceof Joi.ValidationError) {
    // https://github.com/sideway/joi/blob/master/API.md#validationerror
    const unifiedErrorMessage = err.details.map((detail) => detail.message).join(' | ');
    const error = new APIError(unifiedErrorMessage, httpStatus.UNPROCESSABLE_ENTITY, false);
    return next(error);
  } else if (!(err instanceof APIError)) {
    let apiError;
    if (err.message === 'invalid csrf token') {
      apiError = new APIError('Please reload your page, and try again.', httpStatus.INTERNAL_SERVER_ERROR, true);
    } else {
      apiError = new APIError(err.message ?? 'Unknown error', httpStatus.INTERNAL_SERVER_ERROR, false);
    }

    return next(apiError);
  }
  return next(err);
});

/*
 * Catch 404 and forward to error handler.
 */
app.use((req, res, next) => {
  const err = new APIError('API route not found', httpStatus.NOT_FOUND);
  return next(err);
});

/*
 * Log error in winston transports except when executing test suite.
 */
if (config.env !== 'test') {
  app.use(expressWinston.errorLogger({
    winstonInstance,
  }));
}

/*
 * Error handler, send stacktrace only during development.
 */
app.use((err, req, res, next) =>
  res.status(err.status).json({
    message: err.isPublic ? err.message : httpStatus[err.status],
    stack: config.env === 'development' ? err.stack : {},
  }),
);


module.exports = app;
