import { join } from "path";
import { promisify } from "util";
import { writeFile } from "fs";
import * as Sentry from "@sentry/node";

import {
  Contact as WbotContact,
  Message as WbotMessage,
  MessageAck,
  Client
} from "whatsapp-web.js";

import Contact from "../../models/Contact";
import Ticket from "../../models/Ticket";
import Message from "../../models/Message";

import { getIO } from "../../libs/socket";
import CreateMessageService from "../MessageServices/CreateMessageService";
import { logger } from "../../utils/logger";
import CreateOrUpdateContactService from "../ContactServices/CreateOrUpdateContactService";
import { OnlyFindTicketService, FindOrCreateTicketService, ValidAndTransferTicket } from "../TicketServices/FindOrCreateTicketService";
import ShowWhatsAppService from "../WhatsappService/ShowWhatsAppService";
import { debounce } from "../../helpers/Debounce";
import UpdateTicketService from "../TicketServices/UpdateTicketService";
import CreateContactService from "../ContactServices/CreateContactService";
import GetContactService from "../ContactServices/GetContactService";
import ShowBotsService from "../WhatsappService/ShowBotsService";
import UpdateCommandService from "../ContactServices/UpdateCommandService";
import GetCommandService from "../ContactServices/GetCommandService";
import ShowMenu from "../../helpers/ShowMenu";
import { ConstructMenu } from "../BotServices/MenuBots";

import formatBody from "../../helpers/Mustache"; 
import ListSettingByKeyService from "../SettingServices/ListSettingByValueService";

interface Session extends Client {
  id?: number;
}

const writeFileAsync = promisify(writeFile);

const verifyContact = async (msgContact: WbotContact, companyId: number): Promise<Contact> => {
  logger.info('Searching or updating contact in database the business: ' + companyId);

  try {
    let profilePicUrl = await msgContact.getProfilePicUrl();
    if (!profilePicUrl)
      profilePicUrl = "/default-profile.png"; // Foto de perfil padrão

    const contactData = {
      name: msgContact.name || msgContact.pushname || msgContact.id.user,
      number: msgContact.id.user,
      profilePicUrl,
      isGroup: msgContact.isGroup,
      companyId: companyId
    };
    const contact = CreateOrUpdateContactService(contactData);
    return contact;
  }
  catch (err) {
    const profilePicUrl = "/default-profile.png"; // Foto de perfil padrão
    const contactData = {
        name: msgContact.name || msgContact.pushname || msgContact.id.user,
        number: msgContact.id.user,
        profilePicUrl,
        isGroup: msgContact.isGroup,
        companyId: companyId
    };
    const contact = CreateOrUpdateContactService(contactData);
    return contact;
  }};

const verifyCommand = async (msgContact: WbotContact, command: string, companyId: number): Promise<Contact> => {
  const contactData = {
    number: msgContact.id.user,
    isGroup: msgContact.isGroup,
    commandBot: command,
    companyId: companyId
  };
  logger.info('Verify and updating command '+ command +' in '+ msgContact.id.user +' in business: ' + companyId);
  
  const contact = UpdateCommandService(contactData);
  return contact;
};

const verifyQuotedMessage = async (
  msg: WbotMessage
): Promise<Message | null> => {
  if (!msg.hasQuotedMsg) return null;

  const wbotQuotedMsg = await msg.getQuotedMessage();

  const quotedMsg = await Message.findOne({
    where: { id: wbotQuotedMsg.id.id }
  });

  if (!quotedMsg) return null;

  return quotedMsg;
};

const verifyMediaMessage = async (
  msg: WbotMessage,
  ticket: Ticket,
  contact: Contact
): Promise<Message> => {
  const quotedMsg = await verifyQuotedMessage(msg);

  const media = await msg.downloadMedia();

  if (!media) {
    throw new Error("ERR_WAPP_DOWNLOAD_MEDIA");
  }

/* Check if media not have a filename
  if (!media.filename) {
    const ext = media.mimetype.split("/")[1].split(";")[0];
    media.filename = `${new Date().getTime()}.${ext}`;
  }
*/
let originalFilename = media.filename ? `-${media.filename}` : ''
// Always write a random filename
const ext = media.mimetype.split("/")[1].split(";")[0];
media.filename = `${new Date().getTime()}${originalFilename}.${ext}`;

  try {
    await writeFileAsync(
      join(__dirname, "..", "..", "..", "public", media.filename),
      media.data,
      "base64"
    );
  } catch (err: any) {
    Sentry.captureException(err);
    logger.error(err);
  }

  const messageData = {
    id: msg.id.id,
    ticketId: ticket.id,
    contactId: msg.fromMe ? undefined : contact.id,
    body: msg.body || media.filename,
    fromMe: msg.fromMe,
    read: msg.fromMe,
    mediaUrl: media.filename,
    mediaType: media.mimetype.split("/")[0],
    quotedMsgId: quotedMsg?.id,
    companyId: ticket.companyId
  };

  await ticket.update({ lastMessage: msg.body || media.filename });
  const newMessage = await CreateMessageService({ messageData, companyId: ticket.companyId });

  return newMessage;
};

const verifyMessage = async (msg: WbotMessage, ticket: Ticket, contact: Contact) => {
  logger.info('Validating message to delivery in '+ contact.number +' and business: '+ ticket.companyId);

  if (msg.type === 'location')
    msg = prepareLocation(msg);

  const quotedMsg = await verifyQuotedMessage(msg);
  const messageData = {
    id: msg.id.id,
    ticketId: ticket.id,
    contactId:  msg.fromMe ? undefined : contact.id,
    body: msg.body,
    fromMe: msg.fromMe,
    mediaType: msg.type,
    read: msg.fromMe,
    quotedMsgId: quotedMsg?.id,
    companyId: ticket.companyId
  };

  await ticket.update({ 
    lastMessage: msg.type === "location" ? 
      msg.location.description ? "Localization - " + 
      msg.location.description.split('\\n')[0] : "Localization" : msg.body });

  await CreateMessageService({ messageData, companyId: ticket.companyId });
};

const prepareLocation = (msg: WbotMessage): WbotMessage => {
  let gmapsUrl = "https://maps.google.com/maps?q=" + msg.location.latitude + "%2C" + msg.location.longitude + "&z=17&hl=pt-BR";

  msg.body = "data:image/png;base64," + msg.body + "|" + gmapsUrl;

  msg.body += "|" + (msg.location.description ? msg.location.description : (msg.location.latitude + ", " + msg.location.longitude))

  return msg;
};

const verifyQueue = async (wbot: Session, msg: WbotMessage, ticket: Ticket, contact: Contact) => {
  logger.info('Starting search by queues the user and connection in business: '+ ticket.companyId);

  const { queues, greetingMessage } = await ShowWhatsAppService(wbot.id!);

  if (queues.length === 1) {

    const deptoIsOpen = await validaHorarioFuncionamento(wbot, msg, ticket, contact, queues[0].id.toString());
    if (deptoIsOpen !== true)
      return;

    logger.warn('Self defining only one queue found');

    await UpdateTicketService({
      ticketData: { queueId: queues[0].id },
      ticketId: ticket.id,
      companyId: ticket.companyId
    });

    return;
  }

  const selectedOption = msg.body;
  const choosenQueue   = queues[+selectedOption - 1];

  if (choosenQueue) {
   
    const deptoIsOpen = await validaHorarioFuncionamento(wbot, msg, ticket, contact, choosenQueue.id.toString());
    if (deptoIsOpen !== true)
      return;

      const chat = await msg.getChat();
      await chat.sendStateTyping();       

      await UpdateTicketService({
        ticketData: { queueId: choosenQueue.id },
        ticketId: ticket.id,
        companyId: ticket.companyId
      });

      if (choosenQueue.greetingMessage !== '') {
        const body = formatBody(`\u200e${choosenQueue.greetingMessage}`, ticket);

        const sentMessage = await wbot.sendMessage(`${contact.number}@c.us`, body);

        await verifyMessage(sentMessage, ticket, contact);
      }

  } else {
    let options = "";

    const chat = await msg.getChat();
    await chat.sendStateTyping();    

    queues.forEach((queue, index) => {
      options += `*${index + 1}* - ${queue.name}\n`;
    });

    const body = formatBody(`\u200e${greetingMessage}\n${options}`, ticket);

    const debouncedSentMessage = debounce(
      async () => {
        const sentMessage = await wbot.sendMessage(`${contact.number}@c.us`, body);
        verifyMessage(sentMessage, ticket, contact);
      },
      3000,
      ticket.id
    );

    debouncedSentMessage();
  }
};

const validaHorarioFuncionamento = async (
  wbot: Session, msg: WbotMessage, ticket: Ticket, contact: Contact, queueId: string) => {

  logger.warn('Validating office hours to queueId '+ queueId +' in business '+ ticket.companyId);

  if (queueId === undefined || queueId === '')
    return true;

  const { queues } = await ShowWhatsAppService(wbot.id);
  const choosenQueue = queues.find(item => item.id.toString() === queueId);
  
  if (choosenQueue && choosenQueue.startWork && choosenQueue.endWork) {
    const Hr = new Date();

    const hh: number = Hr.getHours() * 60 * 60;
    const mm: number = Hr.getMinutes() * 60;
    const hora = hh + mm;

    const inicio: string = choosenQueue.startWork;
    const hhinicio = Number(inicio.split(':')[0]) * 60 * 60;
    const mminicio = Number(inicio.split(':')[1]) * 60;
    const horainicio = hhinicio + mminicio;

    const termino: string = choosenQueue.endWork;
    const hhtermino = Number(termino.split(':')[0]) * 60 * 60;
    const mmtermino = Number(termino.split(':')[1]) * 60;
    const horatermino = hhtermino + mmtermino;

    if ((hora < horainicio) || (hora > horatermino)) {
      const chat = await msg.getChat();
      await chat.sendStateTyping();    

        const body = formatBody(`\u200e${choosenQueue.absenceMessage}`, ticket);

        const debouncedSentMessage = debounce(
            async () => {
                const sentMessage = await wbot.sendMessage(`${contact.number}@c.us`, body);

                verifyMessage(sentMessage, ticket, contact);
            },
            3000,
            ticket.id
        );

        debouncedSentMessage();

        return false;

    } else {
      return true;
    }
  } else {
    return true;
  }
}

const verifyBots = async (wbot: Session, msg: WbotMessage, ticket: Ticket, contact: Contact) => {
  logger.info('Validating the existence of a bot controller for the business: ' + ticket.companyId);

  const bots = await ShowBotsService(ticket.companyId);
  const { greetingMessage } = await ShowWhatsAppService(wbot.id!);

  if (bots.length === 0) {
    return bots.length;
  }

  const commandContact = await msg.getContact();  
  const lastCommand    = await GetCommandService(contact.number, ticket.companyId); // essa linha não atualiza o comando, apenas busca o comando salvo no contato
  const selectedOption = lastCommand?.commandBot ? lastCommand?.commandBot + '.' + msg.body : msg.body;
  const choosenBot     = bots.find(bot => bot.commandBot === selectedOption);
  if (choosenBot) {
    let body = '';

    switch (choosenBot.commandType) {
      case 1: // INFORMATIVO
        body = `\u200e${choosenBot.showMessage}`;
        await verifyCommand(commandContact, "", choosenBot.companyId);
        break;

      case 2: // MENU
        body = `\u200e${ShowMenu(selectedOption, bots)}`;
        await verifyCommand(commandContact, choosenBot.commandBot, choosenBot.companyId);
        break;

      case 3: // SETOR
        const deptoIsOpen = await validaHorarioFuncionamento(wbot, msg, ticket, contact, choosenBot.queueId.toString());

        if (deptoIsOpen === true) {
          body = `\u200e${choosenBot.showMessage}`;
          await verifyCommand(commandContact, choosenBot.commandBot, choosenBot.companyId);
                  
          await UpdateTicketService({
            ticketData: { queueId: choosenBot.queueId },
            ticketId: ticket.id,
            companyId: choosenBot.companyId
          });
        }
        break;

      case 4: // ATENDENTE
        body = `\u200e${choosenBot.showMessage}`;
        await verifyCommand(commandContact, choosenBot.commandBot, choosenBot.companyId);
        await UpdateTicketService({
          ticketData: { userId: choosenBot.userId },
          ticketId: ticket.id,
          companyId: choosenBot.companyId
        });
        break;
    }

    if (body !== '') {
      const chat = await msg.getChat();
      await chat.sendStateTyping();  

      body = formatBody(`\u200e${body}`, ticket);
      const sentMessage = await wbot.sendMessage(`${contact.number}@c.us`, body);

      await verifyMessage(sentMessage, ticket, contact);

      return 1;
    }
  } else {
    if (lastCommand?.commandBot) { // já está em atendimento, NÃO mostrar o menu novamente!
      return true;
    }

    const chat = await msg.getChat();
    await chat.sendStateTyping();    

    let options = await ConstructMenu(ticket.companyId);
    const body = formatBody(`\u200e${greetingMessage}\n\n${options}`, ticket);

    const debouncedSentMessage = debounce(async () => {
        const sentMessage = await wbot.sendMessage(
          `${contact.number}@c.us`,
          body
        );

        verifyMessage(sentMessage, ticket, contact);
        return 1;
      }, 
      3000, ticket.id
    );

    debouncedSentMessage();
  }
};

const isValidMsg = (msg: WbotMessage): boolean => {
  if (msg.from === "status@broadcast") return false;

  if (
    msg.type === "chat" ||
    msg.type === "audio" ||
    msg.type === "call_log" ||
    msg.type === "ptt" ||
    msg.type === "video" ||
    msg.type === "image" ||
    msg.type === "document" ||
    msg.type === "vcard" ||
    //msg.type === "multi_vcard" ||
    msg.type === "sticker" ||
    msg.type === "e2e_notification" || // Ignore Empty Messages Generated When Someone Changes His Account from Personal to Business or vice-versa
    msg.type === "notification_template" || // Ignore Empty Messages Generated When Someone Changes His Account from Personal to Business or vice-versa
    msg.author != null || // Ignore Group Messages
    msg.type === "location"
  )
    return true;
  return false;
};

const handleMessage = async (msg: WbotMessage, wbot: Session): Promise<void> => {
  if (!isValidMsg(msg)) {
    return;
  }

  let ticket;

  try {
    let msgContact: WbotContact;
    let groupContact: Contact | undefined;

    if (msg.fromMe) {
      // messages sent automatically by wbot have a special character in front of it
      // if so, this message was already been stored in database;
      if (/\u200e/.test(msg.body[0])) return;

      // media messages sent from me from cell phone, first comes with "hasMedia = false" and type = "image/ptt/etc"
      // in this case, return and let this message be handled by "media_uploaded" event, when it will have "hasMedia = true"

      if (!msg.hasMedia && msg.type !== "location" && msg.type !== "chat" && msg.type !== "vcard"
        //&& msg.type !== "multi_vcard"
      ) return;

      msgContact = await wbot.getContactById(msg.to);
    } else {
      msgContact = await msg.getContact();
    }

    const chat = await msg.getChat();

    const whatsapp = await ShowWhatsAppService(wbot.id!);
    let howCompanyId = whatsapp.companyId;

    logger.info('Reading and validating the message for the business: ' + howCompanyId);

    if (chat.isGroup) {
      let msgGroupContact;

      logger.warn('The contact is group');

      if (msg.fromMe) {
        msgGroupContact = await wbot.getContactById(msg.to);
      } else {
        msgGroupContact = await wbot.getContactById(msg.from);
      }

      groupContact = await verifyContact(msgGroupContact, howCompanyId);
    }

    const unreadMessages = msg.fromMe ? 0 : chat.unreadCount;

    const contact = await verifyContact(msgContact, howCompanyId);
 
    ticket = await OnlyFindTicketService(
      contact,
      wbot.id!, 
      groupContact,
      howCompanyId 
    );  

    howCompanyId =  ticket?.companyId ? ticket?.companyId : howCompanyId;   

    if (ticket && 
       (unreadMessages === 0 && 
        whatsapp.farewellMessage && 
        formatBody(whatsapp.farewellMessage, ticket).trim() === msg.body.trim()))
    { return }
 
    const ticketTransf = await ValidAndTransferTicket(ticket?.id, howCompanyId);  
    if (ticketTransf && ticketTransf !== undefined) 
      ticket = ticketTransf;

    ticket = await FindOrCreateTicketService(
      contact,
      wbot.id!,
      unreadMessages,
      groupContact,
      howCompanyId
    );
 
    await verifyContact(msgContact, howCompanyId);

    if (msg.hasMedia) {
      await verifyMediaMessage(msg, ticket, contact);
    } else {
      await verifyMessage(msg, ticket, contact);
    }

    if (
      !ticket.queue &&
      !chat.isGroup &&
      !msg.fromMe &&
      !ticket.userId &&
      whatsapp.queues.length >= 1
    ) {

      const useBotByQueue = await ListSettingByKeyService('useBotByQueueSample', howCompanyId);
      logger.warn('The result about using controller bot per queue is: ' + useBotByQueue?.value);

      if (useBotByQueue?.value === 'disabled') {
        logger.warn('> Starting multilevel bot search...');

        await verifyBots(wbot, msg, ticket, contact); 
      } else {
        logger.warn('> Starting search by queue legacy bot...');

        await verifyQueue(wbot, msg, ticket, contact);      
      }
    }

    if (msg.type === "vcard") {
      try {
        const array = msg.body.split("\n");
        const obj = [];
        let contact = "";
        for (let index = 0; index < array.length; index++) {
          const v = array[index];
          const values = v.split(":");
          for (let ind = 0; ind < values.length; ind++) {
            if (values[ind].indexOf("+") !== -1) {
              obj.push({ number: values[ind] });
            }
            if (values[ind].indexOf("FN") !== -1) {
              contact = values[ind + 1];
            }
          }
        }
        for await (const ob of obj) {
          const cont = await CreateContactService({
            name: contact,
            number: ob.number.replace(/\D/g, ""),
            companyId: ticket.companyId
          });
        }
      } catch (error) {
        console.log(error);
      }
    }

    /* if (msg.type === "multi_vcard") {
      try {
        const array = msg.vCards.toString().split("\n");
        let name = "";
        let number = "";
        const obj = [];
        const conts = [];
        for (let index = 0; index < array.length; index++) {
          const v = array[index];
          const values = v.split(":");
          for (let ind = 0; ind < values.length; ind++) {
            if (values[ind].indexOf("+") !== -1) {
              number = values[ind];
            }
            if (values[ind].indexOf("FN") !== -1) {
              name = values[ind + 1];
            }
            if (name !== "" && number !== "") {
              obj.push({
                name,
                number
              });
              name = "";
              number = "";
            }
          }
        }

        // eslint-disable-next-line no-restricted-syntax
        for await (const ob of obj) {
          try {
            const cont = await CreateContactService({
              name: ob.name,
              number: ob.number.replace(/\D/g, "")
            });
            conts.push({
              id: cont.id,
              name: cont.name,
              number: cont.number
            });
          } catch (error) {
            if (error.message === "ERR_DUPLICATED_CONTACT") {
              const cont = await GetContactService({
                name: ob.name,
                number: ob.number.replace(/\D/g, ""),
                email: ""
              });
              conts.push({
                id: cont.id,
                name: cont.name,
                number: cont.number
              });
            }
          }
        }
        msg.body = JSON.stringify(conts);
      } catch (error) {
        console.log(error);
      }
    } */
  } catch (err) {
    Sentry.captureException(err);
    logger.error(`Error handling whatsapp message: Err: ${err}`);
  }
};

const handleMsgAck = async (msg: WbotMessage, ack: MessageAck) => {
  await new Promise(r => setTimeout(r, 500));

  const io = getIO();

  try {
    const messageToUpdate = await Message.findByPk(msg.id.id, {
      include: [
        "contact",
        {
          model: Message,
          as: "quotedMsg",
          include: ["contact"]
        }
      ]
    });
    if (!messageToUpdate) {
      return;
    }
    await messageToUpdate.update({ ack });

    io.to(messageToUpdate.ticketId.toString()).emit(`appMessage-${messageToUpdate.companyId}`, {
      action: "update",
      message: messageToUpdate
    });
  } catch (err) {
    Sentry.captureException(err);
    logger.error(`Error handling message ack. Err: ${err}`);
  }
};

const wbotMessageListener = (wbot: Session): void => {
  wbot.on("message_create", async msg => {
    handleMessage(msg, wbot);
  });

  wbot.on("media_uploaded", async msg => {
    handleMessage(msg, wbot);
  });

  wbot.on("message_ack", async (msg, ack) => {
    handleMsgAck(msg, ack);
  });
};

export { wbotMessageListener, handleMessage };
