import AppError from "../../errors/AppError";
import Contact from "../../models/Contact";
import { logger } from "../../utils/logger";

interface ExtraInfo {
  name: string;
  value: string;
}

interface Request {
  name: string;
  number: string;
  email?: string;
  profilePicUrl?: string;
  extraInfo?: ExtraInfo[];
  companyId: number
}

const CreateContactService = async ({
  name,
  number,
  email = "",
  companyId,
  extraInfo = []
}: Request): Promise<Contact> => {
  logger.info('Data contact to create contact in business: '+ companyId);
  logger.warn('\nName: '+ name +'\nNumber: '+ number +'\nEmail: '+ email);

  const numberExists = await Contact.findOne({
    where: { number, companyId: companyId }
  });

  if (numberExists) {
    throw new AppError("ERR_DUPLICATED_CONTACT");
  }

  const contact = await Contact.create(
    {
      name,
      number,
      email,
      companyId,
      extraInfo
    },
    {
      include: ["extraInfo"]
    }
  );

  return contact;
};

export default CreateContactService;
