import { Op } from "sequelize";
import Company from "../../models/Company";
import Queue from "../../models/Queue";
import Whatsapp from "../../models/Whatsapp";

const ListWhatsAppsService = async (companyId: number): Promise<Whatsapp[]> => {
  let whereCondition = {}

  if (companyId > 0) {
    whereCondition = {
      [Op.and]: [{ companyId: companyId }],
    }
  }

  const whatsapps = await Whatsapp.findAll({
    where: whereCondition,
    include: [
      {
        model: Queue,
        as: "queues",
        attributes: ["id", "name", "color", "greetingMessage", "startWork", "endWork", "absenceMessage"]
      },
      {
        model: Company,
        as: "company",
        attributes: ["id", "name"]
      }
    ]
  });

  return whatsapps;
};

export default ListWhatsAppsService;
