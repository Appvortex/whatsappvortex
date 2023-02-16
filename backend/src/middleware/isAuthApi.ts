import { Request, Response, NextFunction } from "express";

import AppError from "../errors/AppError";
import ListSettingByValueService from "../services/SettingServices/ListSettingByValueService";
import jwt_decode from "jwt-decode";
import { logger } from "../utils/logger";

const isAuthApi = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  logger.warn('Access systema by Auth api Key...');

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AppError("ERR_SESSION_EXPIRED", 401);
  }

  const [, token] = authHeader.split(" ");
  const userJWT: any = token && await jwt_decode(token); 

  try {
    logger.warn('Try with business in access token is: ' + userJWT.companyId);

    const getToken = await ListSettingByValueService(token, userJWT.companyId);
    if (!getToken) {
      throw new AppError("ERR_SESSION_EXPIRED", 401);
    }

    if (getToken.value !== token) {
      throw new AppError("ERR_SESSION_EXPIRED", 401);
    }

    if (getToken.companyId !== userJWT.companyId) {
      throw new AppError("ERR_SESSION_EXPIRED", 401);
    }    
  } catch (err) {
    throw new AppError(
      "Invalid token. We'll try to assign a new one on next request",
      403
    );
  }

  return next();
};

export default isAuthApi;
