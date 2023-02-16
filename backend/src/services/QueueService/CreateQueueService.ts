import * as Yup from "yup";
import AppError from "../../errors/AppError";
import Queue from "../../models/Queue";

interface QueueData {
  name: string;
  color: string;
  greetingMessage?: string;
  companyId?: number;
  startWork?: string;
  endWork?: string;
  absenceMessage?: string;  
}

const CreateQueueService = async (queueData: QueueData): Promise<Queue> => {
  const { color, name } = queueData;

  const queueSchema = Yup.object().shape({
    name: Yup.string()
      .min(2, "ERR_QUEUE_INVALID_NAME")
      .required("ERR_QUEUE_INVALID_NAME")
      .test(
        "Check-unique-name",
        "ERR_QUEUE_NAME_ALREADY_EXISTS",
        async value => {
          if (value) {
            const queueWithSameName = await Queue.findOne({
              where: { name: value, companyId: queueData.companyId }
            });

            return !queueWithSameName;
          }
          return false;
        }
      ),
    color: Yup.string()
      .required("ERR_QUEUE_INVALID_COLOR")
      .test("Check-color", "ERR_QUEUE_INVALID_COLOR", async value => {
        if (value) {
          const colorTestRegex = /^#[0-9a-f]{3,6}$/i;
          return colorTestRegex.test(value);
        }
        return false;
      })
      .test(
        "Check-color-exists",
        "ERR_QUEUE_COLOR_ALREADY_EXISTS",
        async value => {
          if (value) {
            const queueWithSameColor = await Queue.findOne({
              where: { color: value, companyId: queueData.companyId }
            });
            return !queueWithSameColor;
          }
          return false;
        }
      )
  });

  try {
    await queueSchema.validate({ color, name });
  } catch (err) {
    throw new AppError(err.message);
  }

  // ------------------------------------------------------- Substituido pelo codigo acima
  // const queueWithSameName = await Queue.findOne({
  //   where: { name, color, companyId: queueData.companyId }
  // }); // findOne retorna um objeto ou null

  // if (queueWithSameName?.id !== undefined) {
  //   throw new AppError("ERR_QUEUE_NAME_ALREADY_EXISTS", 400);
  // }

  try {
    var queue = await Queue.create(queueData);
  } catch (err: any) {
    throw new AppError(err.message);
  }

  return queue;
};

export default CreateQueueService;