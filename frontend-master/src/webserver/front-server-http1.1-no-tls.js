'use strict';

const express = require('express'),
  { createProxyMiddleware } = require('http-proxy-middleware'),
  path = require('path'),
  compression = require('compression'),
  logger = require('morgan'),
  cookieParser = require('cookie-parser'),
  helmet = require('helmet'),

  config = require('./config/config');

const app = express();

app.disable('x-powered-by');

const apiProxy = createProxyMiddleware({ target:config.reverseProxy, changeOrigin: true });
app.use("/api", apiProxy);

app.use(helmet({
  frameguard: {
    action: 'deny'
  },
  contentSecurityPolicy: {
    // Specify directives
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "blob:", "data:"]
    },

    // Set to true if you only want browsers to report errors, not block them
    reportOnly: false
  }
}));
app.use((req, res, next) => {
  const csp = res.getHeader("Content-Security-Policy");
  res.setHeader("X-WebKit-CSP", csp);
  res.setHeader("X-Content-Security-Policy", csp);
  next();
});

app.use(compression());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use('/', express.static(__dirname + '/public'));

app.get('/*', function (req, res) {
  res.sendFile(path.join(__dirname, '/public/index.html'));
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  let err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500).send({
    message: err.message
  });
});

app.listen(config.frontend_port, function () {
  console.log(`Orange Expert Management App listening on port ${config.frontend_port}!`);
});

module.exports = app;
