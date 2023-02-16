import AppError from "../../errors/AppError";
import Setting from "../../models/Setting";
import { logger } from "../../utils/logger";

interface Response {
  key: string;
  value: string;
  companyId: number;
}

const ListSettingByKeyService = async (value: string, companyId: number): Promise<Response | undefined> => {
  logger.info('Get params the business: ' + companyId);

  const settings = await Setting.findOne({
    where: { 
      companyId: companyId,
      key: value
    }
  });

  if (!settings) {
    throw new AppError("ERR_NO_API_TOKEN_FOUND", 404);
  }

  return { key: settings.key, value: settings.value, companyId: settings.companyId };
};

export default ListSettingByKeyService;
