import AppError from "../../errors/AppError";
import Contact from "../../models/Contact";
import ContactCustomField from "../../models/ContactCustomField";
import { logger } from "../../utils/logger";

interface ExtraInfo {
  id?: number;
  name: string;
  value: string;
}
interface ContactData {
  email?: string;
  number?: string;
  name?: string;
  commandBot?: string;
  companyId?: number;
  extraInfo?: ExtraInfo[];
}

interface Request {
  contactData: ContactData;
  contactId: string;
}

const UpdateContactService = async ({contactData, contactId}: Request): Promise<Contact> => { 
  const { email, name, number, extraInfo, commandBot, companyId } = contactData;

  logger.info('Update contact in service with phone '+ number +' and business: '+ companyId);

  const contact = await Contact.findOne({
    where: { id: contactId, companyId: companyId },
    attributes: ["id", "name", "number", "email", "profilePicUrl", "commandBot"],
    include: ["extraInfo"]
  });

  if (!contact) {
    throw new AppError("ERR_NO_CONTACT_FOUND", 404);
  }

  if (extraInfo) {
    await Promise.all(
      extraInfo.map(async info => {
        await ContactCustomField.upsert({ ...info, contactId: contact.id });
      })
    );

    await Promise.all(
      contact.extraInfo.map(async oldInfo => {
        const stillExists = extraInfo.findIndex(info => info.id === oldInfo.id);

        if (stillExists === -1) {
          await ContactCustomField.destroy({ where: { id: oldInfo.id } });
        }
      })
    );
  }

  await contact.update({
    name,
    number,
    email,
	  commandBot,
    companyId
  });

  await contact.reload({
    attributes: ["id", "name", "number", "email", "profilePicUrl", "commandBot", "companyId"],
    include: ["extraInfo"]
  });

  return contact;
};

export default UpdateContactService;
