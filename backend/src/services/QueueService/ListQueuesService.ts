import Queue from "../../models/Queue";
import { Op } from "sequelize";

const ListQueuesService = async (companyId: number): Promise<Queue[]> => {

  let whereCondition = {}

  if (companyId > 0) {
    whereCondition = {
      [Op.and]: [{ companyId: companyId }],
    }
  }

  const queues = await Queue.findAll({
    where: whereCondition,
    order: [["name", "ASC"]]
  });

  return queues;
};

export default ListQueuesService;
