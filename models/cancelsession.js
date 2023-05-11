'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class cancelSession extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      cancelSession.belongsTo(models.SportSession,{
        foreignKey:"sessionId",
      })
      
    }

    static async addReason({reason,sessionId}){
      return this.create({reason:reason,sessionId:sessionId});
    }


  }
  cancelSession.init({
    reason: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'cancelSession',
  });
  return cancelSession;
};