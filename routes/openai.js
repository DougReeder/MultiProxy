const express = require('express');
const { corsAllowPrivate, corsRS } = require('../util/corsMiddleware');
const {join} = require("node:path");
const router = express.Router();

router.options('/:command*',
    async (req, res, next) => {
      // not authenticated, but no disk nor network access required, so we can allow more
      // await rateLimiterReward(req.ip, Math.round(POINTS_UNAUTH_REQUEST / 2));
      res.logLevel = 'debug';
      next();
    },
    corsAllowPrivate,
    corsRS
);

router.post('/:command*', function(req, res, next) {
  if (['chat'].includes(req.params.command)) {
    const newUrl = join(process.env.OPEN_AI_URL, req.url);
    const authorization = `Bearer ${process.env.OPEN_AI_API_KEY}`
  res.header('Authorization', authorization);
  res.send(`not yet forwarding your request: ${newUrl} ${req.params.command}\n`);
    // res.send(`not yet forwarding your request: ${req.baseUrl}${req.url} ${JSON.stringify(req.params.command)} ${JSON.stringify(req.body)}\n`);
  } else {
    res.status(400).type('text/plain').send(`I don't understand "${req.params.command}"\n`);
  }
});

module.exports = router;
