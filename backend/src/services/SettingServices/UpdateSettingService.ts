import AppError from "../../errors/AppError";
import Setting from "../../models/Setting";
import { logger } from "../../utils/logger";

interface Request {
  key: string;
  value: string;
  companyId: number;
}

const UpdateSettingService = async ({key, value, companyId}: Request): Promise<Setting | undefined> => {
  if (companyId) 
    logger.info('Requisited update in params with key '+ key +' value '+ value +' in business: '+ companyId);
  else 
    logger.warn('Requisited update in params with key '+ key +' value '+ value +' as SuperAdmin ');

  let setting;
  setting = await Setting.findOne({ 
    where: {
      key
    }
  });  

  if (!(setting)) {
    throw new AppError("ERR_NO_SETTING_FOUND", 404)
  }
    
  if (companyId && companyId > 0) {
    await Setting.update({ value }, {
      where: {
        key, companyId
      }
    });
  } else {
    await Setting.update({ value }, {
      where: {
        key
      }
    }); 
  }
 
  return setting;
};
 
export default UpdateSettingService;
