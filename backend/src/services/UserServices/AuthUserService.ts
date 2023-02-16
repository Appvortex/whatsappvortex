import User from "../../models/User";
import AppError from "../../errors/AppError";
import {
  createAccessToken,
  createRefreshToken
} from "../../helpers/CreateTokens";
import { SerializeUser } from "../../helpers/SerializeUser";
import Queue from "../../models/Queue";
import ShowCompanyService from "../CompanyService/ShowCompanyService";
import Company from "../../models/Company";

interface SerializedUser {
  id: number;
  name: string;
  email: string;
  profile: string;
  queues: Queue[];
  company: Company;
}

interface Request {
  email: string;
  password: string;
}

interface Response {
  serializedUser: SerializedUser;
  token: string;
  refreshToken: string;
}

const AuthUserService = async ({ email, password }: Request): Promise<Response> => {
  const user = await User.findOne({
    where: { email },
    include: ["queues"] 
  });
  
  if (!user) {
    throw new AppError("ERR_INVALID_CREDENTIALS", 401);
  }

  if (user.companyId !== null) {
    const company = await ShowCompanyService(user!.companyId);
    if (!company.status) {
      throw new AppError("ERR_INACTIVE_COMPANY", 401);
    }    
    
    user["company"] = company; 
  }

  if (!(await user.checkPassword(password))) {
    throw new AppError("ERR_INVALID_CREDENTIALS", 401);
  }

  const token = createAccessToken(user);
  const refreshToken = createRefreshToken(user);

  const serializedUser = SerializeUser(user);

  return {
    serializedUser,
    token,
    refreshToken
  };
};

export default AuthUserService;
