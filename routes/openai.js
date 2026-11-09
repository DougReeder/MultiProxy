const express = require('express');
const { corsAllowPrivate, corsRS } = require('../util/corsMiddleware');
const makeUrl = require('../util/makeUrl');
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

router.post('/:command*', async function(req, res, next) {
  if (['chat'].includes(req.params.command)) {
    const newUrl = makeUrl(process.env.OPEN_AI_URL, req.url);
    const authorization = `Bearer ${process.env.OPEN_AI_API_KEY}`;

    try {
      const response = await fetch(newUrl, {
        method: 'POST',
        headers: {
          'Authorization': authorization,
          'Content-Type': req.get('Content-Type') || 'application/json'
        },
        body: JSON.stringify(req.body)
      });

      res.status(response.status);
      for (const [key, value] of response.headers.entries()) {
        res.setHeader(key, value);
      }

      if (response.body) {
        const { Readable } = require('stream');
        Readable.fromWeb(response.body).pipe(res);
      } else {
        res.end();
      }
    } catch (error) {
      console.error('Proxy error:', error);
      res.status(500).send('Error proxying request');
    }
  } else {
    res.status(400).type('text/plain').send(`I don't understand "${req.params.command}"\n`);
  }
});

module.exports = router;
