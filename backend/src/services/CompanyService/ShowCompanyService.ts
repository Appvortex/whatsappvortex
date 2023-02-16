import Company from "../../models/Company";
import AppError from "../../errors/AppError";

const ShowCompanyService = async (id: string | number): Promise<Company> => {
  const contact = await Company.findByPk(id, {
    attributes: ["id", "name", "email", "numberAttendants", "numberConections", "status"],
  });

  if (!contact) {
    throw new AppError("ERR_NO_CONTACT_FOUND", 404);
  }

  return contact;
};

export default ShowCompanyService;
