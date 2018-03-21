const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080; //Defaults to 8080 if not specified
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const COOKIE_USERNAME = 'username';
app.use(bodyParser.urlencoded({extened: true}));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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

app.get('/urls', (req, res) => {
  let templateVars = {urls: urlDatabase, username: req.cookies.username};
  res.render("urls_index", templateVars);
});

app.get('/urls/new', (req, res) => {
  let templateVars = {username: req.cookies.username};
  res.render('urls_new');
});

app.get('/urls/:id', (req, res) => {
  let templateVars = {shortURL: req.params.id, urls: urlDatabase, username: req.cookies.username};
  res.render("urls_show", templateVars);
});

app.get('/u/:shortURL', (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.post('/urls/:id/delete', (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/');
});

app.post('/urls', (req, res) =>{
  let shortUrl = generateRandomString();
  urlDatabase[shortUrl] = req.body.longURL;
  res.redirect(`http://localhost:8080/urls/${shortUrl}`);
});

app.post('/urls/:id', (req, res) => {
  urlDatabase[req.params.id] = req.body.newURL;
  res.redirect('/');
});

app.post('/login', (req, res) => {
  let userName = req.body.username;
  res.cookie(COOKIE_USERNAME, userName);
  res.redirect('/');
});

app.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_USERNAME);
  res.redirect('/');
});

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});

