require('dotenv').config();
const express = require('express');
const session = require('express-session');
const { ExpressOIDC } = require('@okta/oidc-middleware');
const path = require('path');

const app = express();
const port = 3000;

app.use(session({
  secret: process.env.EXPRESS_APP_SECRET,
  resave: true,
  saveUninitialized: false
}));

const oidc = new ExpressOIDC({
  issuer: `${process.env.OKTA_ORG_URL}/oauth2/default`,
  client_id: process.env.OKTA_CLIENT_ID,
  client_secret: process.env.OKTA_CLIENT_SECRET,
  appBaseUrl: process.env.APP_BASE_URL,
  scope: 'openid profile email'
});

app.use(oidc.router);

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use('/static', express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  if (req.userContext) {
    res.redirect('/dashboard');
  } else {
    res.render('home');
  }
});

app.get('/dashboard', oidc.ensureAuthenticated(), (req, res) => {
  const WORKFORCE_POOL = process.env.WORKFORCE_POOL;
  const WORKFORCE_PROVIDER = process.env.WORKFORCE_PROVIDER;
  const NOTEBOOK_URL = process.env.NOTEBOOK_URL;    
  res.render('dashboard', { user: req.userContext.userinfo, workforce_pool: WORKFORCE_POOL, workforce_provider: WORKFORCE_PROVIDER, notebook_url: NOTEBOOK_URL });
});

app.post('/logout', oidc.forceLogoutAndRevoke(), (req, res) => {
  res.redirect('/');
});

// Start server
oidc.on('ready', () => {
  app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
  });
});

oidc.on('error', err => {
  console.error('OIDC Middleware Error: ', err);
});
