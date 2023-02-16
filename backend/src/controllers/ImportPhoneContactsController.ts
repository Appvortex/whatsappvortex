import { Request, Response } from "express";
import ImportContactsService from "../services/WbotServices/ImportContactsService";
import jwt_decode from "jwt-decode";

export const store = async (req: Request, res: Response): Promise<Response> => {
  // eslint-disable-next-line radix
  const userId: number = parseInt(req.user.id);
  const userJWT: any = req.headers.authorization && await jwt_decode(req.headers.authorization.replace('Bearer ', ''))
  
  await ImportContactsService(userId, userJWT.companyId);

  return res.status(200).json({ message: "contacts imported" });
};
