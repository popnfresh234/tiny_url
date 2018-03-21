const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080; //Defaults to 8080 if not specified
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const COOKIE_USERNAME = 'username';
const COOKIE_USER_ID = "user_id";

app.use(bodyParser.urlencoded({extened: true}));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(cookieParser());

const urlDatabase = {
  iXYI4g: {
    longUrl: 'http://www.google.ca',
    userId: 'no one'
  }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

function generateRandomString(){
  var randomString = '';
  var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 6; i++){
    let randomNumber = Math.floor(Math.random() * chars.length);
    randomString += chars.charAt(randomNumber);
  }
  return randomString;
}

app.get('/', (req, res) => {
  res.redirect('/urls');
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/hello', (req, res) => {
  res.end('<html><body>Hello <b>World</b></body></html>\n');
});

app.get('/register', (req, res) => {
  let userId = req.cookies[COOKIE_USER_ID];
  let templateVars = {user: users[userId]};
  res.render('urls_register', templateVars);
});

app.get('/urls', (req, res) => {
  let userId = req.cookies[COOKIE_USER_ID];
  let templateVars = {urls: urlDatabase, user: userId};
  console.log(urlDatabase);
  res.render("urls_index", templateVars);
});

app.get('/urls/new', (req, res) => {
  let userId = req.cookies[COOKIE_USER_ID];
  let templateVars = {user: userId};
  if(userId){
    res.render('urls_new', templateVars);
  } else{
    res.redirect('/login');
  }
});

app.get('/urls/:id', (req, res) => {
  let userId = req.cookies[COOKIE_USER_ID];
  let templateVars = {shortURL: req.params.id, urls: urlDatabase, user: users[userId]};
  res.render("urls_show", templateVars);
});

app.get('/u/:shortURL', (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get('/login', (req, res) => {
  let userId = req.cookies[COOKIE_USER_ID];
  let templateVars = {user: users[userId]};
  res.render('urls_login', templateVars);
});

app.post('/urls/:id/delete', (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/');
});

app.post('/urls', (req, res) =>{
  let userId = req.cookies[COOKIE_USER_ID];
  let shortUrl = generateRandomString();
  let urlObj = {
    longUrl: req.body.longURL,
    userId: userId
  };

  urlDatabase[shortUrl] = urlObj;

  res.redirect(`http://localhost:8080/urls/${shortUrl}`);
});

app.post('/urls/:id', (req, res) => {
  let userId = req.cookies[COOKIE_USER_ID];
  urlDatabase[COOKIE_USER_ID] = userId;
  urlDatabase[req.params.id] = req.body.newURL;
  res.redirect('/');
});

app.post('/login', (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  let id = req.body.id;
  let matchedUser;

  for(var userId in users){
     let user = users[userId];
    if(user.email == email && user.password == password){
       matchedUser = user;
    }
  }

  if(matchedUser){
    res.cookie(COOKIE_USER_ID, matchedUser.id);
    res.redirect('/');
  } else {
    res.statusCode = 403;
    res.send("Bad login info");
  }
});

app.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_USER_ID);
  res.redirect('/');
});

app.post('/register', (req, res) => {
  let randomId = generateRandomString();
  let email = req.body.email;
  let password = req.body.password;

  if (!email || !password){
    res.statusCode = 400;
    res.send("Empty email or password");
  } else {
    users[randomId] = {
      id: randomId,
      email: email,
      password: password
    };
  }

  res.cookie(COOKIE_USER_ID, randomId);
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});

