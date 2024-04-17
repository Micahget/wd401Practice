/* eslint-disable */
'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UserAccount extends Model {
    static associate(models) {
      // define association here
      UserAccount.hasMany(models.Sessions, {
        foreignKey: 'userId',
      })

    }
    // method to fetch all the users 
    static getAllUsers() {  
      return this.findAll();
    }
    
  }
  UserAccount.init({
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    role: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'UserAccount',
  });
  return UserAccount;
};