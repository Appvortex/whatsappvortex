import { getIO } from "../../libs/socket";
import Contact from "../../models/Contact";

interface Request {
  number: string;
  isGroup: boolean;
  commandBot?: string;
  companyId?: number;
}

const UpdateCommandService = async ({
  number: rawNumber,
  isGroup,
  commandBot = "",
  companyId
}: Request): Promise<Contact> => {
  const number = isGroup ? rawNumber : rawNumber.replace(/[^0-9]/g, "");
  
  const io = getIO();
  let contact: Contact | null;

  contact = await Contact.findOne({ where: { number, companyId: companyId } });

  if (contact) {
    contact.update({ commandBot: commandBot });

    io.emit("contact", {
      action: "update",
      contact
    });
  } else {
      // aparentemente NUNCA vai cair aqui... depois resolvo isso ....
      console.log('aparentemente NUNCA vai cair aqui... depois resolvo isso ....');
    contact = await Contact.create({
      number,
      commandBot,
      companyId: companyId,
      isGroup
    });

    io.emit("contact", {
      action: "create",
      contact
    });
  }

  return contact;
};

export default UpdateCommandService;
