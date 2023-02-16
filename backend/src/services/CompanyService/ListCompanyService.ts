import { Op, Sequelize } from "sequelize";
import Company from "../../models/Company";

interface Request {
  searchParam?: string;
  pageNumber?: string | number;
}

interface Response {
  company: Company[];
  count: number;
  hasMore: boolean;
}

const ListCompanysService = async ({
  pageNumber = "1"
}: Request): Promise<Response> => {
  const limit = 20;
  const offset = limit * (+pageNumber - 1);

  const { count, rows: company } = await Company.findAndCountAll({
    limit,
    offset
  });

  const hasMore = count > offset + company.length;

  return {
    company,
    count,
    hasMore
  };
};

export default ListCompanysService;
