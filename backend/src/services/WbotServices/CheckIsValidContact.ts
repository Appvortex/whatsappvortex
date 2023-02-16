import AppError from "../../errors/AppError";
import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import { getWbot } from "../../libs/wbot";
import { logger } from "../../utils/logger";

const CheckIsValidContact = async (number: string, companyId: number): Promise<void> => {
  logger.info('Cheking if contact is valid in business: '+ companyId);

  const defaultWhatsapp = await GetDefaultWhatsApp(0, companyId);

  const wbot = getWbot(defaultWhatsapp.id);

  try {
    const isValidNumber = await wbot.isRegisteredUser(`${number}@c.us`);
    if (!isValidNumber) {
      logger.warn('Contact is not valid: '+ number);

      throw new AppError("invalidNumber");
    }
  } catch (err: any) {
    if (err.message === "invalidNumber") {
      logger.warn('Contact is not valid: '+ number);
      
      throw new AppError("ERR_WAPP_INVALID_CONTACT");
    }
    throw new AppError("ERR_WAPP_CHECK_CONTACT");
  }
};

export default CheckIsValidContact;
