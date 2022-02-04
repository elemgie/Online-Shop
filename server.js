const express = require('express');
const app = express();
const cookieParser = require("cookie-parser");
const sessions = require('express-session');
const port = 8080;

const oneDay = 1000 * 60 * 60 * 24;

//session middleware
app.use(sessions({
    secret: "F57CE72ECB5C64E6DAA58581A8662",
    saveUninitialized:true,
    cookie: { maxAge: oneDay },
    resave: false
}));

let productList = [
  {
    id: 'U23093249028409238049',
    name: "Produkt przykładowy",
    price: 134.24,
    description: "Lin ke lsk djflkgj d lkgjfdl kgjdf kjgj fdoigj dfkjgdknikdfn gifd gkjdf o dfkfdk j kfdgjikfd kjfd nkdfj kdfjj dfk fdj gjdf dfk dfnoidfgn kdfjngdf m lkdmfolgm dfljdifj lkdf m gkjfdngkfdhglk dfjgkndfo gho",
    quantity: 2455
  },
  {
    id: 'U23093249sdf028409238049',
    name: "Marchewa",
    price: 134.24,
    description: "Lin ke lsk djflkgj d lkgjfdl kgjdf kjgj fdoigj dfkjgdknikdfn gifd gkjdf o dfkfdk j kfdgjikfd kjfd nkdfj kdfjj dfk fdj gjdf dfk dfnoidfgn kdfjngdf m lkdmfolgm dfljdifj lkdf m gkjfdngkfdhglk dfjgkndfo gho",
    quantity: 300
  },
  {
    id: 'U2309312dsfdf3409238049',
    name: "Trampki",
    price: 134.24,
    description: "Lin ke lsk djflkgj d lkgjfdl kgjdf kjgj fdoigj dfkjgdknikdfn gifd gkjdf o dfkfdk j kfdgjikfd kjfd nkdfj kdfjj dfk fdj gjdf dfk dfnoidfgn kdfjngdf m lkdmfolgm dfljdifj lkdf m gkjfdngkfdhglk dfjgkndfo gho",
    quantity: 300
  }
]

const getProductById = id => productList.filter(obj => obj.id == id)[0];

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

app.get('/products', function(req, res) {
  if(req.query.search && req.query.search != ""){
    res.render('pages/products', {
      products: productList.filter(product => product.name.toLowerCase().indexOf(req.query.search.toLowerCase()) != -1)
    });
  } else {
    res.render('pages/products', {
      products: productList
    });
  }
  
});

app.get('/product/:id', function(req, res) {
  res.render('pages/product',{
    product: getProductById(req.params.id)
  });
});

app.listen(port);
console.log(`Listening on http://127.0.0.1:${port}`);