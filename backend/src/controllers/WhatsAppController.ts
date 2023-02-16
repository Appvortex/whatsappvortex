import { Request, Response } from "express";
import { getIO } from "../libs/socket";
import { removeWbot } from "../libs/wbot";
import AppError from "../errors/AppError";
import { StartWhatsAppSession } from "../services/WbotServices/StartWhatsAppSession";

import CreateWhatsAppService from "../services/WhatsappService/CreateWhatsAppService";
import DeleteWhatsAppService from "../services/WhatsappService/DeleteWhatsAppService";
import ListWhatsAppsService from "../services/WhatsappService/ListWhatsAppsService";
import ShowWhatsAppService from "../services/WhatsappService/ShowWhatsAppService";
import UpdateWhatsAppService from "../services/WhatsappService/UpdateWhatsAppService";
import jwt_decode from "jwt-decode";
import ShowCompanyService from "../services/CompanyService/ShowCompanyService";

interface WhatsappData {
  name: string;
  queueIds: number[];
  greetingMessage?: string;
  farewellMessage?: string;
  status?: string;
  isDefault?: boolean;
  companyId?: number
}

export const index = async (req: Request, res: Response): Promise<Response> => {

  const userJWT: any = req.headers.authorization && await jwt_decode(req.headers.authorization.replace('Bearer ', ''))

  const whatsapps = await ListWhatsAppsService(userJWT.companyId);

  return res.status(200).json(whatsapps);
};

export const store = async (req: Request, res: Response): Promise<Response> => {

  const userJWT: any = req.headers.authorization && await jwt_decode(req.headers.authorization.replace('Bearer ', ''))

  const WhatsApps = await ListWhatsAppsService(userJWT.companyId);
  const company: any = await ShowCompanyService(userJWT.companyId)

  if (WhatsApps.length >= Number(company.dataValues.numberConections)) {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  const {
    name,
    status,
    isDefault,
    greetingMessage,
    farewellMessage,
    queueIds
  }: WhatsappData = req.body;

  const { whatsapp, oldDefaultWhatsapp } = await CreateWhatsAppService({
    name,
    status,
    isDefault,
    greetingMessage,
    farewellMessage,
    queueIds,
    companyId: userJWT.companyId
  });

  StartWhatsAppSession(whatsapp);

  const io = getIO();
  io.emit(`whatsapp-${userJWT.companyId}`, {
    action: "update",
    whatsapp
  });

  if (oldDefaultWhatsapp) {
    io.emit("whatsapp", {
      action: "update",
      whatsapp: oldDefaultWhatsapp
    });
  }

  return res.status(200).json(whatsapp);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId } = req.params;

  const whatsapp = await ShowWhatsAppService(whatsappId);

  return res.status(200).json(whatsapp);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { whatsappId } = req.params;
  const whatsappData = req.body;
  const userJWT: any = req.headers.authorization && await jwt_decode(req.headers.authorization.replace('Bearer ', ''))

  if (!whatsappData)
    whatsappData.companyId = userJWT.companyId;
 
  const { whatsapp, oldDefaultWhatsapp } = await UpdateWhatsAppService({
    whatsappData,
    whatsappId
  });

  const io = getIO();
  io.emit("whatsapp", {
    action: "update",
    whatsapp
  });

  if (oldDefaultWhatsapp) {
    io.emit("whatsapp", {
      action: "update",
      whatsapp: oldDefaultWhatsapp
    });
  }

  return res.status(200).json(whatsapp);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { whatsappId } = req.params;

  const userJWT: any = req.headers.authorization && await jwt_decode(req.headers.authorization.replace('Bearer ', ''))

  await DeleteWhatsAppService(whatsappId);
  removeWbot(+whatsappId);

  const io = getIO();
  io.emit(`whatsapp-${userJWT.companyId}`, {
    action: "delete",
    whatsappId: +whatsappId
  });

  return res.status(200).json({ message: "Whatsapp deleted." });
};
