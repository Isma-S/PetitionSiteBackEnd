import { v4 as uuidv4 } from 'uuid';
const generateToken = (): string => {
    const token = uuidv4();
    return token;
}
export {generateToken};