import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import { getWbot } from "../../libs/wbot";
import { logger } from "../../utils/logger";

const CheckContactNumber = async (number: string, companyId: number): Promise<void> => {
  logger.info('Cheking contact number '+ number +' in business: '+ companyId);

  const defaultWhatsapp = await GetDefaultWhatsApp(0, companyId);

  const wbot = getWbot(defaultWhatsapp.id);

  const validNumber: any = await wbot.getNumberId(`${number}@c.us`);
  return validNumber.user
};

export default CheckContactNumber;
