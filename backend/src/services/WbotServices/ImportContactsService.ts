import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import { getWbot } from "../../libs/wbot";
import Contact from "../../models/Contact";
import { logger } from "../../utils/logger";
import { Op } from "sequelize";

const ImportContactsService = async (userId: number, companyId: number): Promise<void> => {
  const defaultWhatsapp = await GetDefaultWhatsApp(userId, companyId!);

  const wbot = getWbot(defaultWhatsapp.id);

  let phoneContacts;

  try {
    phoneContacts = await wbot.getContacts();
  } catch (err) {
    logger.error(`Could not get whatsapp contacts from phone. Err: ${err}`);
  }

  if (phoneContacts) {
    await Promise.all(
      phoneContacts.map(async ({ number, name }) => {
        if (!number) {
          return null;
        }

        if (number.substr(0, 2) === '55' && number.length === 13 && number.substr(4, 1) === '9') {
          number = number.substr(0, 4) + number.substr(-8); 
        }

        if (!name) {
          name = number;
        }

        const numberExists = await Contact.findOne({
          where: {             
            companyId: companyId,
            [Op.or]: [{
              number: {
                [Op.or]: [number, name],              
              },            
              name: [name, number]
            }]
        }});
 
        if (numberExists) return null;

        let profilePicUrl = await wbot.getProfilePicUrl(`${number}@c.us`);
        if (!profilePicUrl)
          profilePicUrl = "/default-profile.png"; // Foto de perfil padrão  

        return Contact.create({ number, name, companyId, profilePicUrl });
      })
    );
  }
};

export default ImportContactsService;
