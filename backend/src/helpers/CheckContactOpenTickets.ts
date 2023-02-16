import { Op } from "sequelize";
import AppError from "../errors/AppError";
import Ticket from "../models/Ticket";
import { logger } from "../utils/logger";

const CheckContactOpenTickets = async (
  contactId: number,
  whatsappId: number,
  companyId?: number | undefined
): Promise<void> => {
  logger.info('Cheking contactId '+ contactId +', whatsappId '+ whatsappId +' and business: '+ companyId);

  const ticket = await Ticket.findOne({
    where: { 
      companyId, contactId, whatsappId, status: { [Op.or]: ["open", "pending"] } 
    }
  });

  if (ticket) {
    throw new AppError("ERR_OTHER_OPEN_TICKET");
  }
};

export default CheckContactOpenTickets;
