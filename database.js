const {Sequelize, DataTypes, Model, Op} = require('sequelize');
const bcrypt = require('bcrypt');

class User extends Model {};
class Product extends Model {};
class Order extends Model {};
class OrderProduct extends Model {};
var db;

async function dbInit(){
  // establishing connection
  const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './db/database'
  });
  db = sequelize;
  // creating tables

  User.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    username: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    salt: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    passwordHash: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    isAdmin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    }
  }, {sequelize});
  
  Product.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    price: {
      type: DataTypes.DECIMAL,
      defaultValue: 0.0,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    }
  }, {sequelize});
  
  Order.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    datePlaced: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false
    },
    total: {
      type: DataTypes.DECIMAL,
      defaultValue: 0.0,
      allowNull:false
    },
    isFulfilled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    }
  }, {sequelize});
  
  OrderProduct.init({
    productId: {
      type: DataTypes.INTEGER,
    },
    orderId: {
      type: DataTypes.INTEGER,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0 
    }
  }, {sequelize});
  
  // creating references

  User.hasMany(Order, {
    foreignKey: {
      name: 'userId'
    }
  });
  Product.belongsToMany(Order, {foreignKey: {name: 'id'}, through: OrderProduct});
  Order.belongsToMany(Product, {foreignKey: {name: 'id'}, through: OrderProduct});
  
  await sequelize.sync();
};

async function addUser(usernameForm, emailForm, passwordForm, isAdminForm = false){  
  // borrowed from here: https://stackoverflow.com/questions/201323/how-can-i-validate-an-email-address-using-a-regular-expression     
  const emailRegex = new RegExp("^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$");
  if(!emailRegex.test(emailForm))
    return {success: false, message: "Podaj poprawny adres email"};
  const uses = await User.findAndCountAll({
    where:{
      [Op.or]:
      [{username: usernameForm},
      {email: emailForm}]
    }
  });
  if(uses.count > 0)
    return {success: false, message: "Podana nazwa użytkownika bądź adres email są już w użyciu!"};
  let generatedSalt = bcrypt.genSaltSync();
  let passwordGeneratedHash = bcrypt.hashSync(passwordForm, generatedSalt);
  await User.create({username: usernameForm, email: emailForm, salt: generatedSalt, passwordHash: passwordGeneratedHash, isAdmin: isAdminForm});
  return {success: true, message: "Zarejestrowano pomyślnie"};
}

async function authenticate_async(usernameForm, passwordForm){
  const req =  await User.findAll({
    where: {
      username: usernameForm
    }
  });
  if(req.length === 0)
    return {success: false, message: "Nie ma takiego użytkownika"}; 
  let result = bcrypt.compareSync(passwordForm, req[0].passwordHash);
  return {success: result, message: (result) ? "Zalogowano pomyślnie" : "Błędna nazwa użytkownika lub hasło"};
}

const authenticate = async (usernameForm, passwordForm) => { return await authenticate_async(usernameForm, passwordForm); }

const isAdmin = async (userId) => {
  const user = await User.findAll({where: {
    id: userId
  }});
  return user[0].isAdmin;
}

const deleteUser = async (userId) =>  {
  const user = await User.findAll({where: {
    id: userId
  }});
  if(user.size === 0) // no such user
    return false;
  User.destroy({where:
  {
    id: userId
  }});
  return true;
}

const getUserList = async () => {
  return await User.findAll({raw: true});
}

const getUser = async (userId) => {
  return await User.findAll({where:
  {
    id: userId
  }, raw: true});
}

const getProductList = async () => {
  return await Product.findAll({
    raw: true
  });
}

const getProduct = async (productId) => 
{
  return await Product.findAll({raw: true, where:
  {
    id: productId
  }});
}

const addProduct = async (nameForm, descForm, priceForm, quantForm) => {
  await Product.create({name: nameForm, description: descForm, price: priceForm, quantity: quantForm });
}

const deleteProduct = async (prodId) => {
  const prod = await Product.findAll({where: {
    id: prodId
  }});
  if(prod.size === 0) // no such user
    return false;
  Product.destroy({where:
  {
    id: prodId
  }});
  return true;
}

const updateProductQuantity = async (prodId, newQuantity) => {
  const prod = await Product.findAll({where: {
    id: prodId
  }});
  if(newQuantity < 0 || prod.size === 0)
    return false;
  await Product.update({quantity: newQuantity}, {where:
  {
    id: prodId
  }});
  return true;
}

const addOrder = async (userID, productList) => {
  let sum = 0.0;
  for(let prod of productList) {
    prod = prod[0];
    if(prod.quantity > await Product.findAll({where: {id: prod.id}, raw: true}).quantity)
      return prod.id;
    sum += prod.price;
  };
  let orderRes = await Order.create({userId: userID, total: sum});
  let orderID = orderRes.dataValues.id;
  for(let prod of productList){
    prod = prod[0];
    await OrderProduct.create({prodId: prod.id, orderId: orderID, quantity: prod.quantity});
  }
  return 0;
}

const getOrderList = async () => {
  return await Order.findAll({raw: true});
}

const getOrder = async (orderID) => 
{
  let res = await OrderProduct.findAll({ where:
  {
    orderId: orderID
  },
  include: {
    model: Product
  },
  raw: true});
  console.log(res);
}

module.exports = {dbInit, addUser, deleteUser, getUserList, getUser, isAdmin, authenticate, getProductList, getProduct, addProduct, deleteProduct, updateProductQuantity, addOrder, getOrderList, getOrder}