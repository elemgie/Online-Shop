const express = require('express');
const app = express();
const cookieParser = require("cookie-parser");
const sessions = require('express-session');
const db = require('./database');
const port = 8080;
const oneDay = 1000 * 60 * 60 * 24;

(async () => {
  await db.dbInit();
  const productList = await db.getProductList();
  const getProductById = id => productList.filter(obj => obj.id == id)[0];
  var session;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(sessions({
      secret: "F57CE72ECB5C64E6DAA58581A8662",
      saveUninitialized:true,
      cookie: { maxAge: oneDay },
      resave: false
  }));

  app.use( express.static( "public" ) );
  app.set('view engine', 'ejs');
  app.use(function(req, res, next) {
    res.locals.username = req.session.username;
    res.locals.cart = req.session.cart;
    next();
  });

  app.get('/', function(req, res) {
    session = req.session;
    res.render('pages/index',{
      username: session.username
    });
  });

  app.get('/register', function(req, res) {
      res.render('pages/register',{
        error: req.query.err
      });
    });
    
  app.post('/register', async(req,res) => {
      try{
        const body = req.body;
        if(body.password != body.confirm_password){
          res.redirect(`/register?err=${encodeURIComponent("Podane hasła nie są identyczne!")}`);
          return;
        }
        if(body.email != body.confirm_email){
          res.redirect(`/register?err=${encodeURIComponent("Podane adresy e-mail nie są identyczne!")}`);
          return;
        }
        const ret = await db.addUser(body.username, body.email, body.password, false);
        if(ret.success){
          res.redirect('/login?p=registration')
        } else {
          res.redirect(`/register?err=${encodeURIComponent(ret.message)}`);
        }
      } catch {
        res.redirect('/register?err=validationerror');
      }
  })

  app.get('/login', function(req, res) {
      res.render('pages/login',{
        error: req.query.err
      });
  });

  app.get('/logout', function(req, res) {
     req.session.destroy();
     res.redirect('/');  
  });

  app.post('/login', async(req,res) => {
      const body = req.body;
      const ret = await db.authenticate(body.username, body.password);
      console.log(ret);
      if(ret.success){
        session=req.session;
        session.userid = ret.id;
        session.username=req.body.username;
        session.cart = {};
        res.redirect('/?p=login');
      } else {
        res.redirect(`/login?err=${encodeURIComponent(ret.message)}`);
      }
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
      product: getProductById(req.params.id),
      cart: req.session.cart
    });
  });

  app.get('/product/:id/getquantity', function(req, res) {
    try {
      const product = getProductById(req.params.id);
      res.end(JSON.stringify({
        status: 0,
        message: "",
        quantity: {
          productQuantity: product.quantity,
          inCart: req.session.cart[product.id] ? req.session.cart[product.id] : 0
        }
      }));
    } catch (error){
      res.end(JSON.stringify({
        status: 1,
        message: error.message,
        quantity: 0
      }));
    }
  });

  app.get('/product/addtocart/:id', function(req,res){
    try {
      session = req.session;
      if(session.cart[req.params.id]){
        session.cart[req.params.id] += 1;
      } else {
        session.cart = {
          ...session.cart,
          [req.params.id]: 1
        }
      }
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        status: 0,
        message: "",
        currentCart: session.cart
      }));
    } catch (error) {
      res.end(JSON.stringify({
        status: 1,
        message: error.message
      }));
    }
    
    res.end();
  });

  app.listen(port);
  console.log(`Listening on http://127.0.0.1:${port}`);
  
})()