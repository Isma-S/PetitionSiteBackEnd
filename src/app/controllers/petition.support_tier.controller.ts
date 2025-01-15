import {Request, Response} from "express";
import Logger from "../../config/logger";
import {validate} from "../resources/validate";
import * as schemas from "../resources/schemas.json";
import {
    addSupportTierToDatabase, deleteSupportTierById,
    getAuthTokenDb,
    getPetitionById,
    getSupportTierById, updateSupportTier
} from "../models/petition.server.model";
import * as users from "../models/user.server.model";
import {globalToken} from "./user.controller";
import {getUserwithToken} from "../models/user.server.model";
import logger from "../../config/logger";

const addSupportTier = async (req: Request, res: Response): Promise<void> => {
    try{
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            res.status(400).send("Invalid ID parameter");
            return;
        }
        const validation = await validate(schemas.support_tier_post, req.body);
        Logger.info(`Thisisownerid:${validation}`)
        if (validation !== true) {
            res.statusMessage = `Bad Request:  ${validation.toString()}`;
            res.status(400).send();
            return ;
        }
        const data = req.body
        try {
            await addSupportTierToDatabase(id, data);
            res.status(201).send("Support tier added successfully");
        } catch (error) {
            Logger.error(`Error adding support tier: ${error.message}`);
            if (error.message.includes("Cannot add more than three support tiers for a petition.")) {
                res.status(403).send("Cannot add more than three support tiers for a petition.");
            } else {
                res.status(500).send("Internal Server Error");
            }
        }
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const editSupportTier = async (req: Request, res: Response): Promise<void> => {
    try {
        const authHeader = req.header('X-Authorization');
        if (authHeader === undefined) {
            res.status(401).send("Unauthorized");
            return ;
        }
        Logger.info(`global token ${globalToken}, currentToken:${authHeader}`);
        Logger.info(`reached here ${globalToken}`);
        const petitionId = parseInt(req.params.id,10);
        if (isNaN(petitionId)) {
            res.status(400).send("Invalid ID parameter");
            return;
        }
        const petition = await getPetitionById(petitionId);
        Logger.info(`thisiispettiton: ${JSON.stringify(petition)}`)
        const userDb = petition.owner_id;
        Logger.info(userDb)
        const userTokenDb = await getUserwithToken(authHeader);
        Logger.info(JSON.stringify(userTokenDb))
        const userTokenDbId = userTokenDb[0].id
        Logger.info(`this is user current :${typeof userTokenDbId} , this userDb${typeof userDb}`);

        Logger.info(`this is user current :${userTokenDbId} , this userDb${userDb}`);
        if (userTokenDbId !== userDb) {
            Logger.info("got here")
            res.status(404).send("User not authenticated,mismatch");
            return;
        }
        const tierId = parseInt(req.params.tierId,10);
        const supportTierDb = await getSupportTierById(tierId);
        Logger.info(`req.params: ${JSON.stringify(supportTierDb)}`);
        // const petitionDb = await getPetitionById(petitionId);

        const title = req.body.title !== undefined ? req.body.title : supportTierDb.title;
        const description = req.body.description !== undefined ? req.body.description : supportTierDb.description;
        const cost = req.body.cost !== undefined ? req.body.cost : supportTierDb.cost;
        Logger.info(`supportTier:${JSON.stringify(req.body)}`)
        // Validating the request body
        const validation = await validate(schemas.support_tier_post, {
            title,
            description,
            cost
        });
        if (validation !== true) {
            res.statusMessage = `Bad Request: ${validation.toString()}`;
            res.status(400).send();
            return;
        }
        const dbresult = await updateSupportTier(tierId,title,description,cost);
        if (dbresult[0].affectedRows > 0 ) {
            res.status(200).send("supporteier updated")
        } else {
            res.status(400).send("gone wrong")
        }

    } catch (err) {
        Logger.error(`Error editing support tier: ${err.message}`);
        res.status(500).send("Internal Server Error");
    }
};


const deleteSupportTier = async (req: Request, res: Response): Promise<void> => {
    try {
        const tierId = parseInt(req.params.tierId, 10); // Assuming the tierId is provided as a route parameter
        if (isNaN(tierId)) {
            res.status(400).send("Invalid tier ID parameter");
            return;
        }

        // Perform the deletion operation by calling the appropriate model function
        const deleteResult = await deleteSupportTierById(tierId);

        // Check if the deletion was successful
        if (deleteResult.affectedRows > 0) {
            res.status(200).send("Support tier deleted successfully");
        } else {
            res.status(404).send("Support tier not found or already deleted");
        }
    } catch (err) {
        Logger.error(`Error deleting support tier: ${err.message}`);
        res.status(500).send("Internal Server Error");
    }
};

export {addSupportTier, editSupportTier, deleteSupportTier};