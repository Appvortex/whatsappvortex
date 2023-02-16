import { Request, Response } from "express";
import AppError from "../errors/AppError";
import ListCompanysService from "../services/CompanyService/ListCompanyService";
import ShowCompanyService from "../services/CompanyService/ShowCompanyService";
import UpdateCompanyService from "./../services/CompanyService/UpdateCompanyService"
import CreateCompanyService from "./../services/CompanyService/CreateCompanyService"
import CreateCompanyExternalService from "./../services/CompanyService/CreateCompanyExternalService"
import DeleteCompanyService from "../services/CompanyService/DeleteCompanyService";

type IndexQuery = {
  searchParam: string;
  pageNumber: string;
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam, pageNumber } = req.query as IndexQuery;

  const { company, count, hasMore } = await ListCompanysService({
    searchParam,
    pageNumber
  });

  return res.json({ company, count, hasMore });
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;

  const contact = await ShowCompanyService(id);

  return res.status(200).json(contact);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  if (req.user.profile !== "admin") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  const { Id } = req.params;
  const Data = req.body;

  const user = await UpdateCompanyService({ Data, Id });


  return res.status(200).json(user);
};

export const create = async (
  req: Request,
  res: Response
): Promise<Response> => {
  if (req.user.profile !== "admin") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  const Data = req.body;

  const user = await CreateCompanyService({ Data });


  return res.status(200).json(user);
};

export const externaCreate = async (
  req: Request,
  res: Response
): Promise<Response> => {

  const Data = req.body;

  const user = await CreateCompanyExternalService({ Data });


  return res.status(200).json(user);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  if (req.user.profile !== "admin") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  const { Id } = req.params;

  await DeleteCompanyService(Id);

  return res.status(200).json({ message: "Company deleted" });

};