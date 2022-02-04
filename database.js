const {Sequelize, DataTypes, Model, Op} = require('sequelize');
const bcrypt = require('bcrypt');

class User extends Model {};
class Product extends Model {};
class Order extends Model {};
class OrderProducts extends Model {};
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
  
  OrderProducts.init({
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
  Product.belongsToMany(Order, {foreignKey: {name: 'orderId'}, through: OrderProducts});
  Order.belongsToMany(Product, {foreignKey: {name: 'productId'}, through: OrderProducts});
  
  await sequelize.sync();
};

async function addUser(usernameForm, emailForm, passwordForm, isAdminForm = false){  
  // validate email here?
  const uses = await User.findAndCountAll({
    where:{
      [Op.or]:
      [{username: usernameForm},
      {email: emailForm}]
    }
  });
  if(uses.count > 0)
    return "Podana nazwa użytkownika bądź adres email są już w użyciu!";
  let generatedSalt = bcrypt.genSaltSync();
  let passwordGeneratedHash = bcrypt.hashSync(passwordForm, generatedSalt);
  await User.create({username: usernameForm, email: emailForm, salt: generatedSalt,
                     passwordHash: passwordGeneratedHash, isAdmin: isAdminForm});
}

async function authenticate_async(usernameForm, passwordForm){
  const req =  await User.findAll({
    where: {
      username: usernameForm
    }
  });
  if(req.length === 0)
    return false; 
  return bcrypt.compareSync(passwordForm, req[0].passwordHash);
}

const authenticate = (usernameForm, passwordForm) => { await authenticate_async(usernameForm, passwordForm); }

(async function(){
  try{
    await dbInit();
    let genSalt = bcrypt.genSaltSync();
    await db.authenticate();
    console.log("Connected successfully");
    const usersq = await db.query(`SELECT * FROM users`);
  }
  catch (err){
    console.log("FUCKED UP!");
    console.log(err);
  }
})();

// do we have to export classes?
module.exports = {User, Product, Order, OrderProducts, dbInit, addUser}