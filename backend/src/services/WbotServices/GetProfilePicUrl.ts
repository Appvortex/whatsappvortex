import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import { getWbot } from "../../libs/wbot";
import { logger } from "../../utils/logger";

const GetProfilePicUrl = async (number: string, companyId: number): Promise<string> => {
  logger.info('Get a picture profile number '+ number +' in business: '+ companyId);

  const defaultWhatsapp = await GetDefaultWhatsApp(0, companyId);

  const wbot = getWbot(defaultWhatsapp.id);

  let profilePicUrl = await wbot.getProfilePicUrl(`${number}@c.us`);
  if (!profilePicUrl)
    profilePicUrl = "/default-profile.png"; // Foto de perfil padrão  

  return profilePicUrl;
};

export default GetProfilePicUrl;
