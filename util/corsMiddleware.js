const cors = require('cors');

module.exports = {
  corsAllowPrivate: function corsAllowPrivate (req, res, next) {
    res.set('Access-Control-Allow-Private-Network', 'true');
    next();
  },
  corsRS: cors({ origin: true, allowedHeaders: 'Content-Type, Authorization, Content-Length, Origin, X-Requested-With', methods: 'OPTIONS, GET, HEAD, POST', exposedHeaders: 'ETag', credentials: true, maxAge: 7200 })
};
