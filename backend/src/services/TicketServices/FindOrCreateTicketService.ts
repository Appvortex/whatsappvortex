import { subSeconds } from "date-fns";
import { Op, Sequelize } from "sequelize";
import Contact from "../../models/Contact";
import Ticket from "../../models/Ticket";
import Whatsapp from "../../models/Whatsapp";
import { logger } from "../../utils/logger";
import ListSettingByKeyService from "../SettingServices/ListSettingByValueService";
import ShowTicketService from "./ShowTicketService";

const OnlyFindTicketService = async (contact: Contact, whatsappId: number, groupContact?: Contact, companyId?: number
): Promise<Ticket> => {
  logger.info('Only searching a ticket existing to contact ' + contact.number + ' in business: ' + companyId);

  let ticket;

  ticket = await Ticket.findOne({
    where: {
      companyId: companyId,
      status: {
        [Op.or]: ["open", "pending"]
      },
      contactId: groupContact ? groupContact.id : contact.id,
      whatsappId: whatsappId
    }
  });

  if (!ticket && groupContact) {
    ticket = await Ticket.findOne({
      where: {
        companyId: companyId,
        contactId: groupContact.id,
        whatsappId: whatsappId
      },
      order: [["updatedAt", "DESC"]]
    });
  }

  if (!ticket && !groupContact) {
    const timeCreateNewTicket = await ListSettingByKeyService('timeCreateNewTicket', Number(companyId));

    ticket = await Ticket.findOne({
      where: {
        companyId: companyId,
        updatedAt: {
          [Op.between]: [+subSeconds(new Date(), Number(timeCreateNewTicket)), +new Date()]
        },
        contactId: contact.id,
        whatsappId: whatsappId
      },
      order: [["updatedAt", "DESC"]]
    });
  }

  if (ticket && ticket?.companyId) {
    ticket = await ShowTicketService(ticket.id, ticket?.companyId);
  }

  return ticket;
};

const FindOrCreateTicketService = async (
  contact: Contact, whatsappId: number, unreadMessages: number, groupContact?: Contact, companyId?: string | number
): Promise<Ticket> => {

  logger.info('Searching or creating a ticket existing to contact ' + contact.number + ' in business: ' + companyId);

  let ticket = await Ticket.findOne({
    where: {
      companyId: companyId,
      status: {
        [Op.or]: ["open", "pending"]
      },
      contactId: groupContact ? groupContact.id : contact.id,
      whatsappId: whatsappId
    }
  });

  if (ticket) {
    logger.warn('Ticket found the ticketId ' + ticket.id + ', status ' + ticket.status + ' and business: ' + ticket.companyId);

    await ticket.update({ unreadMessages });
  }

  if (!ticket && groupContact) {
    logger.warn('Ticket now not found, verify if is group contact in business: ' + companyId);

    ticket = await Ticket.findOne({
      where: {
        companyId: companyId,
        contactId: groupContact.id,
        whatsappId: whatsappId
      },
      order: [["updatedAt", "DESC"]]
    });

    if (ticket) {
      logger.warn('Ticket found 2x the ticketId ' + ticket.id + ', status ' + ticket.status + ' and business: ' + ticket.companyId);
      logger.info('Updating to status pending and userId is null...');

      await ticket.update({
        status: "pending",
        userId: null,
        unreadMessages
      });
    }
  }

  if (!ticket && !groupContact) {
    logger.warn('Here ticket not found old and not found group contacts...');

    const timeCreateNewTicket = await ListSettingByKeyService('timeCreateNewTicket', Number(companyId));

    ticket = await Ticket.findOne({
      where: {
        companyId: companyId,
        updatedAt: {
          [Op.between]: [+subSeconds(new Date(), Number(timeCreateNewTicket?.value)), +new Date()]
        },
        contactId: contact.id,
        whatsappId: whatsappId
      },
      order: [["updatedAt", "DESC"]]
    });

    if (ticket) {
      logger.info('Here is updating ticket to status pending...');

      await ticket.update({
        status: "pending",
        userId: null,
        unreadMessages
      });
    }
  }

  if (!ticket) {
    logger.warn('A ticket not found, searching by WhatsApp with business: ' + companyId);

    let whatsapp = await Whatsapp.findOne({
      where: {
        companyId: companyId,
        id: whatsappId
      }
    });

    let setContactId;
    if (groupContact) {
      setContactId = groupContact.id
    } else {
      setContactId = contact.id;
    }

    logger.warn('Creting a new ticket to contact ' + setContactId + ' and business set with data for whatsapp is: ' + whatsapp?.companyId);

    ticket = await Ticket.create({
      contactId: setContactId,
      status: "pending",
      isGroup: !!groupContact,
      unreadMessages,
      whatsappId,
      companyId: whatsapp?.companyId
    });
  }

  ticket = await ShowTicketService(ticket.id, ticket.companyId);

  return ticket;
};

const ValidAndTransferTicket = async (ticketId?: number | undefined, companyId?: number) : Promise<Ticket | undefined> => {  
  logger.info('Validating data to auto ticket transfer with status pending in business: ' + companyId);

  let ticket; 
  const afterMinutesToTransfer = await ListSettingByKeyService('afterMinutesToTransfer', Number(companyId));
  const departmentToTransfer = await ListSettingByKeyService('afterMinutesTicketWithoutDepartmentTransferTo', Number(companyId));
  const Seconds = Number(afterMinutesToTransfer?.value);
  const deptoTo = Number(departmentToTransfer?.value); 

  if (Seconds > 0 && deptoTo > 0) {
    ticket = await Ticket.findAll({
      where: {
        companyId: companyId,
        status: {
          [Op.eq]: 'pending'
        },
        queueId: {
          [Op.eq]: null,
        },
        [Op.and]: [
          Sequelize.where(
            Sequelize.fn('timestampdiff', Sequelize.literal('SECOND'),  
              Sequelize.fn('timestampadd', Sequelize.literal('SECOND'), Seconds, Sequelize.col('updatedAt')),
              Sequelize.fn('current_timestamp')
            ), '>', Seconds)
        ],     
      },
      order: [["updatedAt", "DESC"]]
    });

    if (ticket && ticket.length !== 0) {
      logger.info('Updating '+ ticket.length +' ticket`s to status pending and transfering ticket`s to queueId: '+ deptoTo);

      await Ticket.update({        
        status: "pending",
        queueId: deptoTo,
        userId: null
      }, {
        where: {
          companyId: companyId,
          status: {
            [Op.eq]: 'pending'
          },
          queueId: {
            [Op.eq]: null,
          },
          [Op.and]: [
            Sequelize.where(
              Sequelize.fn('timestampdiff', Sequelize.literal('SECOND'),  
                Sequelize.fn('timestampadd', Sequelize.literal('SECOND'), Seconds, Sequelize.col('updatedAt')),
                Sequelize.fn('current_timestamp')
              ), '>', Seconds)
          ],     
        }
      });
    }
  }
 
  if (Number(ticketId) > 0 && ticketId !== undefined)
    ticket = await Ticket.findByPk(ticketId);

  return ticket ? ticket : undefined;
}

  export { OnlyFindTicketService, FindOrCreateTicketService, ValidAndTransferTicket };