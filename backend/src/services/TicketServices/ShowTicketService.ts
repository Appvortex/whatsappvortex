import Ticket from "../../models/Ticket";
import AppError from "../../errors/AppError";
import Contact from "../../models/Contact";
import User from "../../models/User";
import Queue from "../../models/Queue";
import Whatsapp from "../../models/Whatsapp";
import { logger } from "../../utils/logger";

const ShowTicketService = async (id: string | number, companyId: number): Promise<Ticket> => {
  logger.warn('Get a ticket to id '+ id +' in business: '+ companyId);

  let ticket;

  try {
    ticket = await Ticket.findOne({
      where: { 
        id: id,
        companyId: companyId 
      },
      include: [
        {
          model: Contact,
          as: "contact",
          attributes: ["id", "name", "number", "profilePicUrl", "email"],
          include: ["extraInfo"]
        },
        {
          model: User,
          as: "user",
          attributes: ["id", "name"]
        },
        {
          model: Queue,
          as: "queue",
          attributes: ["id", "name", "color"]
        },
        {
          model: Whatsapp,
          as: "whatsapp",
          attributes: ["name"]
        }
      ]    
    });
  } catch (err) {
    logger.error('Error searching ticket in ShowTicketService, error: \n' + err);
  }

  if (!ticket) {
    logger.error("ERR_NO_TICKET_FOUND");
    throw new AppError("ERR_NO_TICKET_FOUND", 404);
  }

  return ticket;
};

export default ShowTicketService;
