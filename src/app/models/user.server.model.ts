import { getPool} from "../../config/db";
import Logger from "../../config/logger";
import {ResultSetHeader} from "mysql2";
import {promises} from "node:dns";

const getAll = async ():Promise<any> => {
    Logger.info('Getting all users from the database');
    const conn = await getPool().getConnection();
    const query = 'select * from user';
    const [rows] = await conn.query(query);
    await conn.release();
    return rows;
};
// Getting user with user:email
const getUser = async (email: string): Promise<any> => {
    Logger.info(`Getting user ${email} from the database`);
    const conn = await getPool().getConnection();
    const query = 'SELECT * FROM user WHERE email = ?';
    const [rows] = await conn.query(query, [email]);
    await conn.release();
    Logger.info(`this is result from rows${JSON.stringify(rows)}`);
    return rows;
}
// Getting user with user:id
const getUserwithId = async (id: number): Promise<any> => {
    Logger.info(`Getting user ${id} from the database`);
    const conn = await getPool().getConnection();
    const query = 'SELECT * FROM user WHERE id = ?';
    const [rows] = await conn.query(query, [[id]]);
    await conn.release();
    Logger.info(`this is result from rows${JSON.stringify(rows)}`);
    return rows;
}
// Getting user with user:token
const getUserwithToken = async (token: string): Promise<any> => {
    Logger.info(`Getting user with token: ${token} from the database`);
    const conn = await getPool().getConnection();
    const query = 'SELECT id FROM user WHERE auth_token = ?';
    const [rows] = await conn.query(query, [token]);
    await conn.release();
    Logger.info(`Result from database: ${JSON.stringify(rows)}`);
    return rows;
    // if (rows.length > 0) {
    //     Logger.info(`Thisisdbresukt ${rows[0]}`)
    //     return rows[0].id; // Return the user id if found
    // } else {
    //     return null; // Return null if no user found
    // }
}
const insert = async (firstName: string, lastName:string, email: string, password:string): Promise<ResultSetHeader> => {
    Logger.info(`Adding user ${firstName} to the database`);
    const conn = await getPool().getConnection();
    const query = 'INSERT INTO user (first_name,last_name,email, password) VALUES(?)';
    const [result] = await conn.query(query,[[firstName,lastName,email,password]]);
    await conn.release();
    return result;
};
const updatePassword = async (id: number, password: string) => {
    Logger.http(`Updating user ${id} password`);
    const conn = await getPool().getConnection();
    const query = 'UPDATE user SET password = ? WHERE id = ?';
    const [result] = await conn.query(query,[password,id]);
    await conn.release();
    return result;
}
// create token for user
const createTokenDb = async (token: string,id: number) => {
    try {
        Logger.info(`Creating token:${token} for the user:${id} in db`);
        const conn = await getPool().getConnection();
        const createQuery = 'UPDATE user SET auth_token = ? where id = ?';
        const [rows] = await conn.query(createQuery,[token,id]);
        await conn.release();
        Logger.info(`this is result from rows${JSON.stringify(rows)}`);
    } catch (err) {
        Logger.error('Error creating token in db', err);
    }
}
// log out user with token
const logoutwithToken = async (token: string)=> {
    try {
        Logger.info(`Getting user with token:${token} from database`);
        const conn = await getPool().getConnection();
        const getQuery = 'SELECT * FROM user WHERE auth_token = ?';
        const [rows] = await conn.query(getQuery, [[token]]);
        if (rows.length === 0) {
            Logger.info("User doesnt exist with that token");
            await conn.release();
            return;
        }
        const user = rows[0];
        const updateQuery = 'UPDATE user SET auth_token = NULL where id = ?';
        await conn.query(updateQuery, [user.id]);
        await conn.release();
        Logger.info(`Successfully logged out user with ID ${user.id}`);
    } catch (err) {
        Logger.error('Error logging out user', err);
        throw err;
    }
}

export {insert,getUser,getUserwithId,getUserwithToken,updatePassword,logoutwithToken,createTokenDb};