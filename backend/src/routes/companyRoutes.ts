import express from "express";
import isAuth from "../middleware/isAuth";
import * as CompanyController from "../controllers/CompanyController";

const companyRoutes = express.Router();

companyRoutes.get("/company", isAuth, CompanyController.index);
companyRoutes.get("/company/:id", isAuth, CompanyController.show);
companyRoutes.put("/company/:Id", isAuth, CompanyController.update);
companyRoutes.post("/company", isAuth, CompanyController.create);
companyRoutes.post("/api/company", CompanyController.externaCreate);
companyRoutes.delete("/company/:Id", isAuth, CompanyController.remove);

export default companyRoutes;