import {Request, Response} from "express";
import Logger from "../../config/logger";
import {
    getPetitionById,
    getSupportersForPetitionFromDB,
    getSupportTierById,
    insertSupportDb
} from "../models/petition.server.model";
import {validate} from "../resources/validate";
import * as schemas from "../resources/schemas.json";
import {getPetition} from "./petition.controller";
import {getUserwithToken} from "../models/user.server.model";


const getAllSupportersForPetition = async (req: Request, res: Response): Promise<void> => {
    try {
        const petitionId = parseInt(req.params.id, 10); // Assuming the petitionId is provided as a route parameter
        if (isNaN(petitionId)) {
            res.status(400).send("Invalid petition ID parameter");
            return;
        }

        // Assuming you have a function to fetch supporters for a petition from the database
        const supporters = await getSupportersForPetitionFromDB(petitionId);
        const returnData = {}
        // Respond with the retrieved supporters
        res.status(200).send(supporters );
    } catch (err) {
        Logger.error(`Error fetching supporters for petition: ${err.message}`);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
};

const addSupporter = async (req: Request, res: Response): Promise<void> => {
    try{
        const validation = await validate(schemas.support_post,req.body);
        if (validation !== true) {
            res.statusMessage = `Bad Request: ${validation.toString()}`;
            res.status(400).send();
            return ;
        }
        const petitionId = parseInt(req.params.id,10);
        if (isNaN(petitionId)) {
            res.status(400).send("Invalid petition ID");
            return;
        }
        const supportTierId  = req.body.supportTierId;
        const message = req.body.message;
        const token = req.header("X-Authorization")
        Logger.info(`this is user token :${token}`)
        const userDb = await getUserwithToken(token);
        const userId = userDb[0].id
        const getPetitionB = await getPetitionById(petitionId);
        if (getPetitionB === undefined) {
            res.status(404).send("not in db")
            return;
        }
        Logger.info(`this is json db :${JSON.stringify(getPetitionB)}`)
        Logger.info(`this is user db :${userDb[0].id}`)
        Logger.info(JSON.stringify(req.params))
        Logger.info(JSON.stringify(req.body))
        Logger.info(`this is params:${petitionId}, body:${supportTierId}`)
        Logger.info(`this is params:${typeof petitionId}, body:${typeof supportTierId}`)
        if (getPetitionB.owner_id === userId) {
            res.status(403).send("Forbidden own petition")
            return;
        }

        // const dbGetResult = await getSupportTierById(supportId);
        // if (!supporterId || isNaN(supporterId)) {
        //     res.status(404).send("Invalid supporter ID");
        //     return;
        // }
        const dbresult = await insertSupportDb(petitionId,userId,supportTierId,message);
        if (dbresult.affectedRows > 0) {
            res.status(201).send("Supporter added successfully");
        }


    } catch (err) {
        Logger.error(`Error adding supporter to petition: ${err.message}`);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
};
export {getAllSupportersForPetition, addSupporter}