const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080; //Defaults to 8080 if not specified
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const methodOverride = require('method-override');

const COOKIE_USERNAME = 'username';
const COOKIE_USER_ID = 'user_id';
const COOKIE_TRACKING = 'tracking';
const BCRYPT_SALT_ROUNDS = 10;
const USER_ID_LENGTH = 10;
const SHORT_URL_LENGTH = 6;

app.use(bodyParser.urlencoded({extened: true}));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(cookieSession({
  name: 'session',
  secret: 'secret',
  maxAge: 24 * 60 * 60 * 1000
}));
app.use(cookieParser());
app.use(methodOverride('_method'));

const urlDatabase = {};
const users = {};

function generateRandomString(length){
  let randomString = '';
  let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    let randomNumber = Math.floor(Math.random() * chars.length);
    randomString += chars.charAt(randomNumber);
  }
  return randomString;
}

function isEmailTaken(email){
  for (let userId in users) {
    let user = users[userId];
    let userEmail = user.email;
    if (userEmail === email) {
      return true;
    } return false;
  }
}

function getHumanTime() {
  let now = new Date();
  let date = [ now.getMonth() + 1, now.getDate(), now.getFullYear() ];
  let time = [ now.getHours(), now.getMinutes(), now.getSeconds() ];
  for ( let i = 1; i < 3; i++ ) {
    if ( time[i] < 10 ) {
      time[i] = '0' + time[i];
    }
  }
  return date.join('/') + ' ' + time.join(':')  + ' UTC';
}

function findMatchedUser(email, password){
  for (let userId in users) {
    let user = users[userId];
    if (user.email === email && bcrypt.compareSync(password, user.password)) {
      return user;
    }
  }
}

app.get('/', (req, res) => {
  if (req.session[COOKIE_USER_ID]) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

app.get('/register', (req, res) => {
  let userId = req.session[COOKIE_USER_ID];
  let templateVars = {user: users[userId]};
  res.render('urls_register', templateVars);
});

app.get('/urls', (req, res) => {
  let userId = req.session[COOKIE_USER_ID];
  let templateVars = {urls: urlDatabase, user: users[userId]};
  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {
  let userId = req.session[COOKIE_USER_ID];
  let templateVars = {user: users[userId]};
  if (userId) {
    res.render('urls_new', templateVars);
  } else {
    res.redirect('/login');
  }
});

app.get('/urls/:id', (req, res) => {
  let userId = req.session[COOKIE_USER_ID];
  let visit = req.cookies[COOKIE_TRACKING];
  let uniqueVisitors = [];

  if (urlDatabase[req.params.id]) {
    let visitors = urlDatabase[req.params.id].visitors;
    for (let visit in visitors) {
      if (uniqueVisitors.indexOf(visitors[visit]) === -1) {
        uniqueVisitors.push(visitors[visit]);
      }
    }
    let templateVars = {shortURL: req.params.id, urls: urlDatabase, user: users[userId], uniqueVisitors: uniqueVisitors};
    res.render('urls_show', templateVars);
  } else {
    res.redirect('/');
  }
});

app.get('/u/:shortUrl', (req, res) => {

  let timeStamp = getHumanTime();
  let urlObject = urlDatabase[req.params.shortUrl];
  let visit = req.cookies[COOKIE_TRACKING];
  if (urlObject) {
    let visitorId = urlObject.visitors[visit];
    if (!visitorId) {
      //New user, create tracking cookie
      res.cookie(COOKIE_TRACKING, timeStamp);
      //create new string
      urlObject.visitors[timeStamp] = generateRandomString(USER_ID_LENGTH);
      res.redirect(urlObject.longUrl);
    } else {
      //Returning user, set visit and ID
      urlObject.visitors[timeStamp] = visitorId;
      res.redirect(urlObject.longUrl);
    }
  } else {
    res.redirect('/');
  }
});

app.get('/login', (req, res) => {
  let userId = req.session[COOKIE_USER_ID];
  if (userId) {
    res.redirect('/urls');
  }
  let templateVars = {user: users[userId]};
  res.render('urls_login', templateVars);
});

app.delete('/urls/:id/', (req, res) => {
  if (req.session[COOKIE_USER_ID] && req.session[COOKIE_USER_ID] === urlDatabase[req.params.id].user_id) {
    delete urlDatabase[req.params.id];
  }
  res.redirect('/');
});

app.post('/urls', (req, res) =>{
  let userId = req.session[COOKIE_USER_ID];
  let shortUrl = generateRandomString(SHORT_URL_LENGTH);
  let urlObj = {
    longUrl: req.body.longURL,
    user_id: userId,
    uniqueVisitorArray: [],
    visitors: {}
  };
  urlDatabase[shortUrl] = urlObj;
  res.redirect(`http://localhost:8080/urls/${shortUrl}`);
});

app.put('/urls/:id', (req, res) => {
  let userId = req.session[COOKIE_USER_ID];
  urlDatabase[req.params.id].longUrl = req.body.newURL;
  res.redirect('/');
});

app.post('/login', (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  let matchedUser = findMatchedUser(email, password);
  if (matchedUser) {
    req.session[COOKIE_USER_ID] = matchedUser.user_id;
    res.redirect('/');
  } else {
    res.statusCode = 403;
    res.send('Bad login info');
  }
});

app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/');
});

app.post('/register', (req, res) => {
  let randomId = generateRandomString(USER_ID_LENGTH);
  let email = req.body.email;
  let password = req.body.password;

  if (!email || !password) {
    res.statusCode = 400;
    res.send('Empty email or password');
  }

  if (isEmailTaken(email)) {
    res.statusCode = 400;
    res.send('Email already registered');
  } else {
    users[randomId] = {
      user_id: randomId,
      email: email,
      password: bcrypt.hashSync(req.body.password, BCRYPT_SALT_ROUNDS)
    };
    req.session[COOKIE_USER_ID] = randomId;
    res.redirect('/urls');
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});