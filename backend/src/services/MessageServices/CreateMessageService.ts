import { getIO } from "../../libs/socket";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";
import User from "../../models/User";
import Whatsapp from "../../models/Whatsapp";
import { logger } from "../../utils/logger";

interface MessageData {
  id: string;
  ticketId: number;
  body: string;
  contactId?: number;
  fromMe?: boolean;
  read?: boolean;
  mediaType?: string;
  mediaUrl?: string;  
}
interface Request {
  messageData: MessageData;
  companyId?: number;
}

const CreateMessageService = async ({ messageData, companyId }: Request): Promise<Message> => {
  logger.info('Processing delivery the message to '+ messageData.contactId + 
    ' in ticketId '+ messageData.ticketId +' and business: '+ companyId);

  await Message.upsert(messageData);

  const message = await Message.findByPk(messageData.id, {
    include: [
      "contact",
      {
        model: Ticket,
        as: "ticket",
        include: [
          "contact", "queue",
          {
            model: Whatsapp,
            as: "whatsapp",
            attributes: ["name"]
          },
          {
            model: User,
            as: "user",
            attributes: ["name"]
          }
        ]
      },
      {
        model: Message,
        as: "quotedMsg",
        include: ["contact"]
      }
    ]
  });

  if (!message) {
    throw new Error("ERR_CREATING_MESSAGE");
  }

  const io = getIO();
  io.to(message.ticketId.toString())
    .to(message.ticket.status)
    .to("notification")
    .emit(`appMessage-${message.ticket.companyId}`, {
      action: "create",
      message,
      ticket: message.ticket,
      contact: message.ticket.contact
    });

  return message;
};

export default CreateMessageService;
