const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080; //Defaults to 8080 if not specified
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const methodOverride = require('method-override');

const COOKIE_USERNAME = 'username';
const COOKIE_USER_ID = "user_id";

app.use(bodyParser.urlencoded({extened: true}));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(cookieSession({
  name: 'session',
  secret: 'secret',
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
app.use(methodOverride('_method'));

const urlDatabase = {};
const users = {};

function generateRandomString(){
  var randomString = '';
  var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 6; i++){
    let randomNumber = Math.floor(Math.random() * chars.length);
    randomString += chars.charAt(randomNumber);
  }
  return randomString;
}

function isEmailTaken(email){
  for (var userId in users){
    var user = users[userId];
    var userEmail = user.email;
    if(userEmail === email){
      return true;
    } return false;
  }
}

app.get('/', (req, res) => {
  if (req.session[COOKIE_USER_ID]){
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
  res.render("urls_index", templateVars);
});

app.get('/urls/new', (req, res) => {
  let userId = req.session[COOKIE_USER_ID];
  let templateVars = {user: users[userId]};
  if(userId){
    res.render('urls_new', templateVars);
  } else{
    res.redirect('/login');
  }
});

app.get('/urls/:id', (req, res) => {
  let userId = req.session[COOKIE_USER_ID];
  let templateVars = {shortURL: req.params.id, urls: urlDatabase, user: users[userId]};
  res.render("urls_show", templateVars);
});

app.get('/u/:shortURL', (req, res) => {
  if(urlDatabase[req.params.shortURL]){
    let longURL = urlDatabase[req.params.shortURL].longUrl;
    console.log(longURL);
    res.redirect(longURL);
  } else {
    res.redirect('/');
  }
});

app.get('/login', (req, res) => {
  let userId = req.session[COOKIE_USER_ID];
  let templateVars = {user: users[userId]};
  res.render('urls_login', templateVars);
});

app.delete('/urls/:id/', (req, res) => {
  if(req.session[COOKIE_USER_ID] && req.session[COOKIE_USER_ID] === urlDatabase[req.params.id].user_id){
    delete urlDatabase[req.params.id];
  }
  res.redirect('/');
});

app.post('/urls', (req, res) =>{
  let userId = req.session[COOKIE_USER_ID];
  let shortUrl = generateRandomString();
  let urlObj = {
    longUrl: req.body.longURL,
    user_id: userId
  };
  urlDatabase[shortUrl] = urlObj;
  res.redirect(`http://localhost:8080/urls/${shortUrl}`);
});

app.put('/urls/:id', (req, res) => {
  let userId = req.session[COOKIE_USER_ID];
  urlDatabase[req.params.id] = {
    longUrl: req.body.newURL,
    user_id: userId
  };
  res.redirect('/');
});

app.post('/login', (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  let id = req.body.id;
  let matchedUser;

  for(var userId in users){
    let user = users[userId];
    if(user.email == email && bcrypt.compareSync(password, user.password)){
       matchedUser = user;
    }
  }

  if(matchedUser){
    req.session[COOKIE_USER_ID] = matchedUser.user_id;
    res.redirect('/');
  } else {
    res.statusCode = 403;
    res.send("Bad login info");
  }
});

app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/');
});

app.post('/register', (req, res) => {
  let randomId = generateRandomString();
  let email = req.body.email;
  let password = req.body.password;

  if (!email || !password){
    res.statusCode = 400;
    res.send("Empty email or password");
  }

  if (isEmailTaken(email)) {
    res.statusCode = 400;
    res.send("Email already registered");
  } else {
    users[randomId] = {
      user_id: randomId,
      email: email,
      password: bcrypt.hashSync(req.body.password, 10)
    };
  }
  req.session[COOKIE_USER_ID] = randomId;
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});