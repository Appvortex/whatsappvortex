import Whatsapp from "../../models/Whatsapp";
import AppError from "../../errors/AppError";
import Queue from "../../models/Queue";
import { logger } from "../../utils/logger";

const ShowWhatsAppService = async (id: string | number): Promise<Whatsapp> => {
  logger.info('Reading data queues the botId '+ id);

  const whatsapp = await Whatsapp.findByPk(id, {
    include: [
      {
        model: Queue,
        as: "queues",
        attributes: ["id", "name", "color", "greetingMessage", "startWork", "endWork", "absenceMessage"]
      }
    ],
    order: [["queues", "name", "ASC"]]
  });

  if (!whatsapp) {
    throw new AppError("ERR_NO_WAPP_FOUND", 404);
  }

  logger.info("Found whatsappId "+ id +" connection in business: " + whatsapp.companyId);

  return whatsapp;
};

export default ShowWhatsAppService;
