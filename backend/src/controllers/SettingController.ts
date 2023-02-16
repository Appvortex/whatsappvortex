import { Request, Response } from "express";

import { getIO } from "../libs/socket";
import AppError from "../errors/AppError";

import UpdateSettingService from "../services/SettingServices/UpdateSettingService";
import ListSettingsService from "../services/SettingServices/ListSettingsService";
import jwt_decode from "jwt-decode";
import { logger } from "../utils/logger";

export const index = async (req: Request, res: Response): Promise<Response> => {
  const userJWT: any = req.headers.authorization && await jwt_decode(req.headers.authorization.replace('Bearer ', ''));

  const settings = await ListSettingsService(userJWT.companyId);

  return res.status(200).json(settings);
};

export const update = async (req: Request, res: Response): Promise<Response> => {
  if (req.user.profile !== "admin") {
    throw new AppError("ERR_NO_PERMISSION", 403)
  }

  const userJWT: any = req.headers.authorization && await jwt_decode(req.headers.authorization.replace('Bearer ', ''));
  const companyId = userJWT.companyId;

  logger.warn('Processing requisited update in business: '+ companyId);

  const { settingKey: key } = req.params;
  const { value } = req.body;

  const setting = await UpdateSettingService({
      key,
      value,
      companyId
    });
 
  const io = getIO();
  io.emit("settings", {
    action: "update",
    setting
  });

  return res.status(200).json(setting);
};
