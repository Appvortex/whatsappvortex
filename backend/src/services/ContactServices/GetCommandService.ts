import Contact from "../../models/Contact";

interface Request {
    number: string;
    companyId: number;
}

const GetCommandService = async (number: string, companyId: number): Promise<Contact | null> => {
    let contact = await Contact.findOne({ where: { number, companyId } });

    return contact;
};

export default GetCommandService;
