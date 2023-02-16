import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.removeConstraint('Settings', 'PRIMARY');
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.addConstraint('Settings', {
      fields: ['key'],
      type: 'primary key'
    });
  }
};