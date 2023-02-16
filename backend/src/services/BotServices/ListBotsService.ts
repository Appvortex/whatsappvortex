import Bot from "../../models/Bot";
import Queue from "../../models/Queue";
import User from "../../models/User";

const ListBotsService = async (companyId: number): Promise<Bot[]> => {
  const bots = await Bot.findAll({
    where: { companyId },
    order: [["commandBot", "ASC"]],
    include: [
      {
        model: Queue,
        as: "queue",
        attributes: ["id", "name"]
      },
      {
        model: User,
        as: "user",
        attributes: ["id", "name"]
      }
    ]
  });

  return bots;
};

export default ListBotsService;