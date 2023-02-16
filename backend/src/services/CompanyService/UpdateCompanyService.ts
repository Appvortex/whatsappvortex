import * as Yup from "yup";

import AppError from "../../errors/AppError";
import { SerializeUser } from "../../helpers/SerializeUser";
import ShowCompanyService from "./ShowCompanyService";

interface UserData {
  email?: string;
  passwordDefault?: string;
  name?: string;
  numberAttendants?: string;
  numberConections: number;
  status: number;
}

interface Request {
  Data: UserData;
  Id: string | number;
}

interface Response {
  user: UserData;
}

const UpdateUserService = async ({ Data, Id }: Request): Promise<Response> => {
  const user = await ShowCompanyService(Id);

  const schema = Yup.object().shape({
    name: Yup.string().min(2),
    email: Yup.string().email(),
    passwordDefault: Yup.string()
  });

  const { email, passwordDefault, numberAttendants, name, numberConections, status } = Data;

  try {
    await schema.validate({ email, passwordDefault, numberAttendants, name, numberConections });
  } catch (err: any) {
    throw new AppError(err.message);
  }

  await user.update({
    email,
    passwordDefault,
    numberAttendants,
    name,
    numberConections,
    status
  });

  await user.reload();

  return { user };
};

export default UpdateUserService;
