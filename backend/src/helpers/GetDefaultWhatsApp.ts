import AppError from "../errors/AppError";
import Whatsapp from "../models/Whatsapp";
import { logger } from "../utils/logger";
import GetDefaultWhatsAppByUser from "./GetDefaultWhatsAppByUser";

const GetDefaultWhatsApp = async (userId: number, companyId: number): Promise<Whatsapp> => {  
  if (userId > 0) {
    const whatsappByUser = await GetDefaultWhatsAppByUser(userId, companyId);
    if (whatsappByUser !== null) {
      return whatsappByUser;
    }
  }

  logger.info('Get a WhastaApp connection default in business: '+ companyId);

  let defaultWhatsapp;

  defaultWhatsapp = await Whatsapp.findOne({
    where: { isDefault: true, companyId: companyId }
  });

  if (!defaultWhatsapp) {
    logger.info('Get any WhastaApp connection in business: '+ companyId);

    defaultWhatsapp = await Whatsapp.findOne({
      where: { companyId: companyId }
    });

    if (!defaultWhatsapp) {
      logger.warn('None WhatsApp connection found in business: '+ companyId);

      throw new AppError("ERR_NO_DEF_WAPP_FOUND");
    } else {
      return defaultWhatsapp;
    }
  } else {
    return defaultWhatsapp;
  }
};

export default GetDefaultWhatsApp;
