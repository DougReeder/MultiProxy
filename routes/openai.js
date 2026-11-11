const express = require('express');
const router = express.Router();
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const { ALLOWED_ORIGINS } = require('../util/constants');

let accessToken;
let accessTokenExpiration;

const corsOpenAI = cors({
  origin: ALLOWED_ORIGINS,
  allowedHeaders: 'Content-Type, Authorization, Content-Length, Origin, X-Requested-With',
  methods: 'OPTIONS, POST',
  exposedHeaders: 'ETag',
  credentials: true,
  maxAge: 7200
});

router.options('/', corsOpenAI);

router.use('/', corsOpenAI,
  async (req, res, next) => {
    try {
      if (!process.env.OPEN_AI_URL.includes('.ibm.com')) {
        return next();
      }
      if (!accessToken || !(Date.now() < accessTokenExpiration)) {
        accessToken = null;
        accessTokenExpiration = null;
        await obtainAccessToken();
      }
      next();
    } catch (err) {
      console.error(err.message || err.toString());
      res.status(502).contentType('text/plain').send("Unable to proxy");
    }
  },
  createProxyMiddleware({
    target: process.env.OPEN_AI_URL,
    changeOrigin: true,
    pathFilter: ['/chat'],
    pathRewrite: (path) => {
      const url = new URL(path, process.env.OPEN_AI_URL);
      if (process.env.OPEN_AI_URL.includes('ibm.com')) {
        // url.pathname = url.pathname.replace(/chat\/completions/, 'chat');
        if (!url.searchParams.has('version')) url.searchParams.set('version', '2024-10-08');
      }
      return url.pathname + url.search;
    },
    on: {
      proxyReq: (proxyReq) => {
        proxyReq.setHeader('Authorization', `Bearer ${accessToken || process.env.OPEN_AI_API_KEY}`);
      },
      proxyRes: (proxyRes) => {
        if (proxyRes.statusCode === 401) {
          accessToken = null;
          accessTokenExpiration = null;
        }
      },
    },
    followRedirects: true,
    logger: console,
  })
);

async function obtainAccessToken() {
  const tokenResponse = await fetch('https://iam.cloud.ibm.com/identity/token', {
    method: "POST",
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${process.env.OPEN_AI_API_KEY}`,
    followRedirects: false,
  });
  if (!tokenResponse.ok) {
    throw new Error(`failed to refresh access token: ${tokenResponse.statusCode} ${await tokenResponse.text()}`, );
  }
  if (tokenResponse.headers.get('Content-Type') && !tokenResponse.headers.get('Content-Type').startsWith('application/json')) {
    throw new Error(`incompatible Content-Type: ${tokenResponse.headers.get('Content-Type')}`);
  }
  const payload = await tokenResponse.json();
  if (payload.access_token) {
    accessToken = payload.access_token;
    accessTokenExpiration = ((payload.expiration || Date.now() + 3600) - 10) * 1000;   // conservative
    console.info(`new access token expires at ${new Date(accessTokenExpiration)}`);
    setTimeout(() => {
      try {
        obtainAccessToken();
      } catch (err) {
        console.error(err.message || err.toString());
      }
    }, accessTokenExpiration - Date.now() - 60_000);
  } else {
    throw new Error(`no access token in response: ${JSON.stringify(payload)}`);
  }
}

module.exports = router;
