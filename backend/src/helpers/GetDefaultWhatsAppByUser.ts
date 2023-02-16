import User from "../models/User";
import Whatsapp from "../models/Whatsapp";
import { logger } from "../utils/logger";

const GetDefaultWhatsAppByUser = async (userId: number, companyId: number): Promise<Whatsapp | null> => {
  logger.info('Get a WhastaApp connection default by user '+ userId +' and in business: '+ companyId);

  const user2: any = await User.findAll({
    where: { id: userId, companyId: companyId }
  });

  const user = user2.dataValues;

  if (user === null || user === undefined) {
    logger.warn('Not found WhatsApp connection by user');

    return null;
  }

  if (user.whatsapp !== undefined && user.whatsapp !== null) {
    logger.info(`Found whatsapp linked to user '${user.name}' is '${user.whatsapp.name}' with business: '${user.whatsapp.companyId}'`);
  }

  return user.whatsapp;
};

export default GetDefaultWhatsAppByUser;
