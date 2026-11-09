// originCheckMiddleware.js — refuses requests from unapproved origins
// Copyright © 2026 Doug Reeder, under the GPLv3 license

const {ALLOWED_ORIGINS} = require('./constants');

const originCheckMiddleware = (req, res, next) => {

  const isAllowed = (value) => {
    if (!value) return false;

    const url = URL.parse(value.startsWith('http') ? value : `http://${value}`);
    return ALLOWED_ORIGINS.includes(url.origin);
  };

  if (isAllowed(req.get('origin')) ) {
    next();
  } else {
    res.status(403).contentType('text/plain').send('Forbidden\n');
  }
};

module.exports = {
  originCheckMiddleware
};
