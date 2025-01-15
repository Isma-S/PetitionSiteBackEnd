import {Request, Response} from "express";
import Logger from '../../config/logger';
import {validate} from "../resources/validate";
import * as schemas from "../resources/schemas.json";
import * as users from "../models/user.server.model";
import logger from "../../config/logger";
import {hash,compare} from '../services/passwords';
import {generateToken} from "../services/generateToken";
import * as trace_events from "trace_events";
import {isNumberObject} from "node:util/types";
import {createTokenDb, getUserwithId, logoutwithToken} from "../models/user.server.model";
let globalToken: string | undefined;
const register = async (req: Request, res: Response): Promise<void> => {
    try{
        // Your code goes here
        Logger.http(`POST register a user with firstname: ${req.body.firstName}`);
        const validation = await validate(schemas.user_register, req.body);
        if (validation !== true) {
            res.statusMessage = `Bad Request:  ${validation.toString()}`;
            res.status(400).send();
            return ;
        }
        const firstName = req.body.firstName;
        const lastName = req.body.lastName;
        const email = req.body.email;
        const password = req.body.password;
        const hashedPassword = await hash(password);
        const existingUser = await users.getUser(email);
        // Check the structure of email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailRegex.test(email) === false) {
            res.status(400).send('Invalid email input');
            return;
        }
        if (existingUser.length !== 0) {
            const user = existingUser[0];
            res.status(403).send(`Email is already used${user.email}`);
            return;
        }
        try {
            const result = await users.insert(firstName, lastName, email, hashedPassword);
            const userId = result.insertId;
            res.status(201).send({userId });
            return;
        } catch (err) {
            res.status(500).send(`Error creating user: ${err}`);
        }
    } catch (err) {
        Logger.error(err);
        res.status(500).send('Internal Server Error');
    }
}

const login = async (req: Request, res: Response): Promise<void> => {
    try{
        // Your code goes here
        Logger.info(`Logging in user with email ${req.body.email}`);
        const email = req.body.email;
        const password = req.body.password;
        const validation = await validate(schemas.user_login, req.body);
        if (validation !== true) {
            res.statusMessage = `Bad Request: ${validation.toString()}`;
            res.status(400).send();
            return ;
        }
        try {
            const result = await users.getUser(email);
            const user = result[0];
            const userId = user.id;
            Logger.info(`this is result${user.password}`);
            if (result.length === 0) {
                res.statusMessage = 'Invalid email or password';
                res.status(401).send();
                return;
            }
            const comparePassword = await compare(password,user.password);
            if ( comparePassword === true ) {
                const token = generateToken();
                Logger.info(`reached here for token ${token}`);
                globalToken = token;
                Logger.info(`reached here for token ${globalToken}`);
                await createTokenDb(token,userId);
                // res.status(200).send(token);
                res.status(200).send({userId , token});
            } else {
                res.status(401).send('Password no match')
            }
        } catch (err) {
            Logger.error(err);
            res.status(500);
        }
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const logout = async (req: Request, res: Response): Promise<void> => {
    try{
        Logger.info("Logging user out");
        const token = req.header('X-Authorization');
        await logoutwithToken(token);
        res.status(200).send("Logged out successfuly");
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const view = async (req: Request, res: Response): Promise<void> => {
    try{
        // Your code goes here
        const id = parseInt(req.params.id,10);
        // Get the token from the Authorization header
        Logger.info(`can reach here-1`);
        const authHeader = req.header('X-Authorization').toString();
        Logger.info(`can reach here`);
        Logger.http(`Getting user with user id: ${id}, and token ${authHeader}`);
        try {
            const result = await users.getUserwithId(id);
            if (result.length === 0) {
                res.status(404).send('User not found');
            }
            // not sure if username needs to b modified??
            const user = result[0];
            // This is not passing when running as collection??
            const tokenDb = user.auth_token;
            Logger.info(`this is the auth from database${tokenDb}`);
            const authUser = {
                firstName: user.first_name,
                lastName: user.last_name,
                email: user.email,
            };
            const unAuthUser = {
                firstName: user.first_name,
                lastName: user.last_name,
            };
            Logger.info(`this is auth token: ${authHeader}, and this db token ${tokenDb}`);
            if (authHeader === tokenDb) {
                Logger.info(`for mike`);
                res.status(200).send(authUser);
                return;
            } else {
                Logger.info(`for kirtys`);
                res.status(200).send(unAuthUser);
            };
        } catch (err) { // doesnt seem to be sending the body?? if else for parseint??
            res.status(400).send(`ERROR reading user ${id}: ${err}`);
        }
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const update = async (req: Request, res: Response): Promise<void> => {
    try{
        Logger.http(`Patch update user id: ${req.params.id}`);
        const id = parseInt(req.params.id,10);
        const email = req.body.email;
        if (isNaN(id)) {
            res.status(400).send(`Bad Request: Id is not a number`)
        }
        // need to be validated??
        const validation = await validate(schemas.user_edit,req.body);
        if (validation !== true) {
            res.statusMessage = `Bad Request: ${validation.toString()}`;
            res.status(400).send();
            return ;
        }
        const authHeader = req.header('X-Authorization');
        if (authHeader === undefined) {
            res.status(401).send("Unauthorized");
            return ;
        }
        Logger.info(`reached here ${authHeader}`);
        const userDb = await users.getUserwithId(id);
        if (userDb.length ===0 ) {
            res.status(404).send("User not found in database");
        }
        const user = userDb[0];
        Logger.info(`this is user id :${user.id} getting user with token`);
        if (authHeader !== user.auth_token) {
            res.status(400).send("User no authenticated,mismatch");
            return ;
        }
        const newPassword = req.body.password;
        const hashedNewPassword = await hash(newPassword);
        const comparePassword = await compare(newPassword,user.password);
        if (comparePassword === true) {
            res.status(403).send("identical currentPassword and password");
        } else {
            const updateResult = await users.updatePassword(user.id,hashedNewPassword);
            if (updateResult.affectedRows === 0) {
                res.status(404).send("something went wrong loll??");
            } else {
                res.status(200).send(`User ${id} password updated`);
            }
        }
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

export {register, login, logout, view, update, globalToken}