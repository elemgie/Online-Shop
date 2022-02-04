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

  app.get('/', function(req, res) {
    res.render('pages/index');
  });

  app.get('/register', function(req, res) {
      res.render('pages/register',{
        errors: req.query.err
      });
    });
    
  app.post('/register', async(req,res) => {
      try{
        const body = req.body;
        const ret = await db.addUser(body.username, body.email, body.password, false);
        if(ret){
          res.redirect(`/register?err=${encodeURIComponent(ret)}`);
        } else {
          res.redirect('/login?p=registration')
        }
      } catch {
        res.redirect('/register?err=validationerror');
      }
  })

  app.get('/login', function(req, res) {
      res.render('pages/login');
  });

  app.post('/login', async(req,res) => {
      const body = req.body;
      const ret = await db.authenticate(body.username, body.password);
      console.log(ret);
      if(ret){
        res.redirect(`/login?err=${encodeURIComponent(ret)}`);
      } else {
        session=req.session;
        session.userid=req.body.username;
        res.redirect('/?p=login');
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
      product: getProductById(req.params.id)
    });
  });

  app.listen(port);
  console.log(`Listening on http://127.0.0.1:${port}`);
  
})()

