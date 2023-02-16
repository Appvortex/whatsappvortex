import { getIO } from "../../libs/socket";
import Contact from "../../models/Contact";
import { logger } from "../../utils/logger";

interface ExtraInfo {
  name: string;
  value: string;
}

interface Request {
  name: string;
  number: string;
  isGroup: boolean;
  email?: string;
  commandBot?: string;
  profilePicUrl?: string;
  extraInfo?: ExtraInfo[];
  companyId?: number;
}

const CreateOrUpdateContactService = async ({
  name,
  number: rawNumber,
  profilePicUrl,
  isGroup,
  email = "",
  commandBot = "",
  extraInfo = [],
  companyId
}: Request): Promise<Contact> => {
  logger.info('Reading params from contact where the business is: ' + companyId);

  const number = isGroup ? rawNumber : rawNumber.replace(/[^0-9]/g, "");

  const io = getIO();
  let contact: Contact | null;

  logger.warn('Searching contact the number ' + number + ' and business: ' + companyId);

  contact = await Contact.findOne({ where: { 
    companyId, number 
  } });

  if (!profilePicUrl)
    profilePicUrl = "/default-profile.png"; // Foto de perfil padrão   

  if (contact) {
    if (contact.companyId === null)
      contact.update({ profilePicUrl, companyId })
    else
      contact.update({ profilePicUrl });

    io.emit(`contact-${contact.companyId}`, {
      action: "update",
      contact
    });
  } else {
    contact = await Contact.create({
      name,
      number,
      profilePicUrl,
      email,
      commandBot,
      companyId,
      isGroup,
      extraInfo
    });

    io.emit("contact", {
      action: "create",
      contact
    });
  }

  return contact;
};

export default CreateOrUpdateContactService;
