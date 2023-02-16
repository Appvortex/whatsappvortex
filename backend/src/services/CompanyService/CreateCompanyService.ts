import * as Yup from "yup";

import AppError from "../../errors/AppError";
import { createAccessToken } from "../../helpers/CreateTokens";
import Company from "../../models/Company";
import Setting from "../../models/Setting";
import User from "../../models/User";

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
}

interface Response {
  user: UserData;
}

const UpdateUserService = async ({ Data }: Request): Promise<Response> => {
  const schema = Yup.object().shape({
    name: Yup.string().min(2),
    email: Yup.string().email(),
    passwordDefault: Yup.string().required()
  });

  const { email, passwordDefault, numberAttendants, name, numberConections, status } = Data;

  try {
    await schema.validate({ email, passwordDefault, numberAttendants, name, numberConections });
  } catch (err: any) {
    throw new AppError(err.message);
  }

  const user = await Company.create({
    email,
    passwordDefault,
    numberAttendants,
    name,
    numberConections,
    status
  });

  await user.reload();

  const temp = await User.create(
    {
      email,
      password: passwordDefault,
      name,
      profile: 'admin',
      whatsappId: null,
      companyId: user.id
    },
    { include: ["queues", "whatsapp"] }
  );

  await Setting.create({
    key: 'userApiToken',
    value: createAccessToken(temp),
    companyId: user.id,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  await Setting.create({
    key: 'allowUserEditConnection',
    value: 'disabled',
    companyId: user.id,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  await Setting.create({
    key: 'transferTicket',
    value: 'disabled',
    companyId: user.id,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  await Setting.create({
    key: 'afterMinutesTicketWithoutDepartmentTransferTo',
    value: '',
    companyId: user.id,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  await Setting.create({
    key: 'afterMinutesToTransfer',
    value: '0',
    companyId: user.id,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  await Setting.create({
    key: 'hideTicketWithoutDepartment',
    value: 'disabled',
    companyId: user.id,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  await Setting.create({
    key: 'useBotByQueueSample',
    value: 'enabled',
    companyId: user.id,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  await Setting.create({
    key: 'showApiKeyInCompanies',
    value: 'disabled',
    companyId: user.id,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  await Setting.create({
    key: 'ticketAutoClose',
    value: '0',
    companyId: user.id,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  await Setting.create({
    key: 'timeCreateNewTicket',
    value: '7200',
    companyId: user.id,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  return { user };
};

export default UpdateUserService;
