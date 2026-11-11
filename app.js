const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { rateLimiterMiddleware } = require('./util/rateLimiterMiddleware');
const { originCheckMiddleware } = require('./util/originCheckMiddleware');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const openaiRouter = require('./routes/openai');
const cors = require("cors");
const {ALLOWED_ORIGINS} = require('./util/constants');
const helmet = require('helmet');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

if (process.env.NODE_ENV === 'production') {
  app.use(originCheckMiddleware);
  console.info('originCheckMiddleware enabled');
  app.use(rateLimiterMiddleware);
  console.info('rateLimiterMiddleware enabled');
  app.use(helmet());
  console.info('helmet enabled');
}

// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));
// app.use(cookieParser());

app.use(logger((tokens, req, res) => {
  const fields = [tokens.method(req, res), tokens.url(req, res), tokens.status(req, res), tokens['response-time'](req, res) + 'ms', '-', tokens.res(req, res, 'content-length')];
  if (req.baseUrl.startsWith('/openai') && req.body) {
    fields.push(JSON.stringify(req.body).slice(0, 100));
  }
  return fields.join(' ');
}));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/', indexRouter);
app.use('/openai', openaiRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
