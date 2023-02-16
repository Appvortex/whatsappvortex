import { Sequelize } from "sequelize";
import QuickAnswer from "../../models/QuickAnswer";

interface Request {
  searchParam?: string;
  pageNumber?: string;
  companyId?: string | number;
}

interface Response {
  quickAnswers: QuickAnswer[];
  count: number;
  hasMore: boolean;
}

const ListQuickAnswerService = async ({
  searchParam = "",
  pageNumber = "1",
  companyId = -1
}: Request): Promise<Response> => {
  let whereCondition = {

  };

  if (companyId > 0) {
    whereCondition = {
      message: Sequelize.where(
        Sequelize.fn("LOWER", Sequelize.col("message")),
        "LIKE",
        `%${searchParam.toLowerCase().trim()}%`
      ),
      companyId: companyId
    };
  } else {
    whereCondition = {
      message: Sequelize.where(
        Sequelize.fn("LOWER", Sequelize.col("message")),
        "LIKE",
        `%${searchParam.toLowerCase().trim()}%`
      )
    };
  }


  const limit = 20;
  const offset = limit * (+pageNumber - 1);

  const { count, rows: quickAnswers } = await QuickAnswer.findAndCountAll({
    where: whereCondition,
    limit,
    offset,
    order: [["message", "ASC"]]
  });

  const hasMore = count > offset + quickAnswers.length;

  return {
    quickAnswers,
    count,
    hasMore
  };
};

export default ListQuickAnswerService;
