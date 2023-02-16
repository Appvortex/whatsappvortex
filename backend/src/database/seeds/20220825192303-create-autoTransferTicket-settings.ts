import { QueryInterface } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.bulkInsert(
      "Settings",
      [
        {
          key: "afterMinutesToTransfer",
          value: "0",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          key: "afterMinutesTicketWithoutDepartmentTransferTo",
          value: "",
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      {}
    );
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.bulkDelete("Settings", {});
  }
};
