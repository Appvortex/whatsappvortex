import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
    up: (queryInterface: QueryInterface) => {
      return queryInterface.addColumn("Settings", "id", {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true        
      });
    },
  
    down: (queryInterface: QueryInterface) => {
      return queryInterface.removeColumn("Settings", "id");
    }
  };
  