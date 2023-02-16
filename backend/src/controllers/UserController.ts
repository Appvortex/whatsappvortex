import { Request, Response } from "express";
import { getIO } from "../libs/socket";

import CheckSettingsHelper from "../helpers/CheckSettings";
import AppError from "../errors/AppError";

import CreateUserService from "../services/UserServices/CreateUserService";
import ListUsersService from "../services/UserServices/ListUsersService";
import UpdateUserService from "../services/UserServices/UpdateUserService";
import ShowUserService from "../services/UserServices/ShowUserService";
import DeleteUserService from "../services/UserServices/DeleteUserService";
import jwt_decode from "jwt-decode";
import ShowCompanyService from "../services/CompanyService/ShowCompanyService";
import Company from "../models/Company";
import ShowUserService2 from "../services/UserServices/ShowUserService2";

type IndexQuery = {
  searchParam: string;
  pageNumber: string;
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam, pageNumber } = req.query as IndexQuery;

  const userJWT: any = req.headers.authorization && await jwt_decode(req.headers.authorization.replace('Bearer ', ''))
  
  const { users, count, hasMore } = await ListUsersService({
    searchParam, 
    pageNumber,
    companyId: userJWT.companyId
  });
  
  return res.json({ users, count, hasMore });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const userJWT: any = req.headers.authorization && await jwt_decode(req.headers.authorization.replace('Bearer ', ''))

  const users = await ShowUserService2(userJWT.companyId);
  const company: any = await ShowCompanyService(userJWT.companyId)
  const v1: number = Number(users.length);
  const v2: number = Number(company.dataValues.numberAttendants);

  if (v1 >= v2) {
    throw new AppError("ERR_NO_LIMIT_USER", 403);
  }

  const { email, password, name, profile, queueIds, whatsappId } = req.body;

  const user = await CreateUserService({
    email,
    password,
    name,
    profile,
    queueIds,
    whatsappId,
    companyId: userJWT.companyId
  });

  const io = getIO();
  io.emit(`user-${userJWT.companyId}`, {
    action: "create",
    user
  });

  return res.status(200).json(user);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { userId } = req.params;

  const user = await ShowUserService(userId);

  return res.status(200).json(user);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  if (req.user.profile !== "admin") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  const { userId } = req.params;
  const userData = req.body;

  const user = await UpdateUserService({ userData, userId });

  const io = getIO();
  io.emit("user", {
    action: "update",
    user
  });

  return res.status(200).json(user);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { userId } = req.params;

  const userJWT: any = req.headers.authorization && await jwt_decode(req.headers.authorization.replace('Bearer ', ''))

  await DeleteUserService(userId);

  const io = getIO();
  io.emit(`user-${userJWT.companyId}`, {
    action: "delete",
    userId
  });

  return res.status(200).json({ message: "User deleted" });
};
