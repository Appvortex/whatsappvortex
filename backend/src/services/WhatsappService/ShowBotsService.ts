import Bots from "../../models/Bot";
import AppError from "../../errors/AppError";
import Queue from "../../models/Queue";
import User from "../../models/User";
import { logger } from "../../utils/logger";

const ShowBotsService = async (companyId: number): Promise<Bots[]> => {
    logger.info('Get botService to business: ' + companyId);

    const bots = await Bots.findAll({
        where: { companyId: companyId },
        include: [
            {
                model: Queue,
                as: "queue",
                attributes: ["id", "name"]
            },
            {
                model: User,
                as: "user",
                attributes: ["id", "name"]
            }
        ],
        order: [["commandBot", "ASC"]]
    });

    if (!bots) {
        throw new AppError("ERR_NO_BOTS_FOUND", 404);
    }

    return bots;
};

export default ShowBotsService;
