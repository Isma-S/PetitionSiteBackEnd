import bcrypt from "bcrypt";
import Logger from '../../config/logger';
const saltRounds = 10;
const hash = async (password: string): Promise<string> => {
    // Todo: update this to encrypt the password
    const hpassword = await bcrypt.hash(password, saltRounds);
    return hpassword
}

const compare = async (password: string, comp: string): Promise<boolean> => {
    // Todo: (suggested) update this to compare the encrypted passwords
    const result = await bcrypt.compare(password,comp);
    Logger.info(`this is original:${result},this is database:${comp},${password}`);
    Logger.info(`this is sfdsadfsad:${password === comp},this is database:${comp},${password}`);
    return result;
}

export {hash, compare}