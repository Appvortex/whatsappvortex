import Company from "../../models/Company";
import AppError from "../../errors/AppError";
import Bot from "../../models/Bot";
import Contact from "../../models/Contact";
import Queue from "../../models/Queue";
import QuickAnswer from "../../models/QuickAnswer";
import Ticket from "../../models/Ticket";
import User from "../../models/User";
import Whatsapp from "../../models/Whatsapp";

const DeleteCompanyService = async (id: string): Promise<void> => {
  const company = await Company.findOne({
    where: { id }
  });

  if (!company) {
    throw new AppError("ERR_NO_CONTACT_FOUND", 404);
  }

  await company.destroy();

  await Bot.destroy({
    where: { companyId: id }
  });

  await Contact.destroy({
    where: { companyId: id }
  });

  await Queue.destroy({
    where: { companyId: id }
  });

  await QuickAnswer.destroy({
    where: { companyId: id }
  });

  await Ticket.destroy({
    where: { companyId: id }
  });

  await User.destroy({
    where: { companyId: id }
  });

  await Whatsapp.destroy({
    where: { companyId: id }
  });
};

export default DeleteCompanyService;
