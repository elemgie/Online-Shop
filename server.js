const express = require('express');
const app = express();
const port = 8080;

app.use( express.static( "public" ) );
app.set('view engine', 'ejs');

app.get('/', function(req, res) {
  res.render('pages/index');
});

app.get('/register', function(req, res) {
    res.render('pages/register');
  });
  
app.get('/login', function(req, res) {
    res.render('pages/login');
});

app.listen(port);
console.log(`Listening on http://127.0.0.1:${port}`);