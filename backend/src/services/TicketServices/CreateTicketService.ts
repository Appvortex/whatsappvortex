import AppError from "../../errors/AppError";
import CheckContactOpenTickets from "../../helpers/CheckContactOpenTickets";
import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import GetDefaultWhatsAppByUser from "../../helpers/GetDefaultWhatsAppByUser";
import Ticket from "../../models/Ticket";
import User from "../../models/User";
import Whatsapp from "../../models/Whatsapp";
import ShowContactService from "../ContactServices/ShowContactService";

interface Request {
  contactId: number;
  status: string;
  userId: number;
  queueId?: number;
  companyId: number
}

const CreateTicketService = async ({
  contactId,
  status,
  userId,
  queueId,
  companyId
}: Request): Promise<Ticket> => {

  let defaultWhatsapp = await GetDefaultWhatsAppByUser(userId, companyId);

  if (!defaultWhatsapp || defaultWhatsapp == null || defaultWhatsapp == undefined) {
    defaultWhatsapp = await GetDefaultWhatsApp(userId, companyId);
  }

  await CheckContactOpenTickets(contactId, defaultWhatsapp.id, companyId);

  const { isGroup } = await ShowContactService(contactId);

  if (queueId === undefined) {
    const user = await User.findByPk(userId, { include: ["queues"] });
    queueId = user?.queues.length === 1 ? user.queues[0].id : undefined;
  }

  const { id }: Ticket = await defaultWhatsapp.$create("ticket", {
    contactId,
    status,
    isGroup,
    userId,
    queueId,
    companyId
  });

  const ticket = await Ticket.findByPk(id, { include: ["contact"] });

  if (!ticket) {
    throw new AppError("ERR_CREATING_TICKET");
  }

  return ticket;
};

export default CreateTicketService;
