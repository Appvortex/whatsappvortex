import { QueryInterface } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.bulkInsert(
      "Settings",
      [
        {
          key: 'hideTicketWithoutDepartment',
          value: 'disabled',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          key: "useBotByQueueSample",
          value: "disabled",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          key: "showApiKeyInCompanies",
          value: "disabled",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          key: "ticketAutoClose",
          value: "0",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          key: "timeCreateNewTicket",
          value: "7200",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          key: 'allowUserEditConnection',
          value: 'disabled',
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
