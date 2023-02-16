import CheckContactOpenTickets from "../../helpers/CheckContactOpenTickets";
import SetTicketMessagesAsRead from "../../helpers/SetTicketMessagesAsRead";
import { getIO } from "../../libs/socket";
import Ticket from "../../models/Ticket";
import { logger } from "../../utils/logger"; 
import ShowTicketService from "./ShowTicketService";

interface TicketData {
  status?: string;
  userId?: number;
  queueId?: number;
  whatsappId?: number;
}

interface Request {
  ticketData: TicketData;
  ticketId: string | number;
  companyId: number;
}

interface Response {
  ticket: Ticket;
  oldStatus: string;
  oldUserId: number | undefined;
}

const UpdateTicketService = async ({ticketData, ticketId, companyId}: Request): Promise<Response> => {
  logger.info('Updating ticketId '+ ticketId +' status '+ ticketData?.status +' in business: ' + companyId);

  const { status, queueId, whatsappId } = ticketData;
  let userId = ticketData?.userId;

  if (userId == 0 || userId == undefined)
    userId = undefined;

  const ticket = await ShowTicketService(ticketId, companyId);
  await SetTicketMessagesAsRead(ticket); 

  if (whatsappId && ticket.whatsappId !== whatsappId) {
    await CheckContactOpenTickets(ticket.contactId, whatsappId, ticket.companyId);
  }

  const oldStatus = ticket.status;
  const oldUserId = ticket.user?.id;

  if (oldStatus === "closed") {
    await CheckContactOpenTickets(ticket.contact.id, ticket.whatsappId, ticket.companyId);
  }

  await ticket.update({
    status,
    queueId,
    userId
  });


  if (whatsappId) {
    await ticket.update({
      whatsappId
    });
  }

  await ticket.reload();

  const io = getIO();

  if (ticket.status !== oldStatus || ticket.user?.id !== oldUserId) {
    io.to(oldStatus).emit(`ticket-${ticket.companyId}`, {
      action: "delete",
      ticketId: ticket.id
    });
  }



  io.to(ticket.status)
    .to("notification")
    .to(ticketId.toString())
    .emit(`ticket-${ticket.companyId}`, {
      action: "update",
      ticket
    });

  return { ticket, oldStatus, oldUserId };
};

export default UpdateTicketService;
