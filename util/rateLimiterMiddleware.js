const { RateLimiterMemory } = require('rate-limiter-flexible');

const rateLimiter = new RateLimiterMemory({
  points: 2,
  duration: 10,
});

const rateLimiterMiddleware = (req, res, next) => {
  rateLimiter.consume(req.ip)
    .then(() => {
      next();
    })
    .catch(() => {
      res.set('Retry-After', '10');
      res.status(429).send('Too Many Requests');
    });
};

module.exports = {
  rateLimiterMiddleware
};
