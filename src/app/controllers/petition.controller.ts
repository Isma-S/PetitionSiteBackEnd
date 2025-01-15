import {Request, Response} from "express";
import Logger from '../../config/logger';
import {
    deletePetitionById,
    getAll,
    getAllCategories,
    getPetitionById, getSupportTierById,
    insertPetition, insertSupportTiers,
    updatePetition
} from "../models/petition.server.model";
import {it} from "node:test";
import {validate} from "../resources/validate";
import * as schemas from "../resources/schemas.json";
import {isNumberObject} from "node:util/types";
import {getUserwithToken, insert} from "../models/user.server.model";
import * as users from "../models/user.server.model";
import {globalToken} from "./user.controller";
import {error} from "winston";

const getAllPetitions = async (req: Request, res: Response): Promise<void> => {
    try{
        const validation = await validate(schemas.petition_search, req.query);
        Logger.info(`Thisisownerid:${validation}`)
        if (validation !== true) {
            res.statusMessage = `Bad Request:  ${validation.toString()}`;
            res.status(400).send();
            return ;
        }
        const petitions = [];
        const startIndex = parseInt(req.query.startIndex as string,10);
        const count = parseInt(req.query.count as string,10);
        const searchQuery = req.query.q as string
        const supportingCost = parseInt(req.query.supportingCost as string,10)
        const supporterId = parseInt(req.query.supporterId as string, 10)
        const ownerId = req.query.ownerId as string
        const sortBy = req.query.sortBy as string
        // Should be handled in schemajson??
        Logger.info(`Thisis the supid${supporterId}`)
        // Check if supporterId exists and is not empty
        // if (isNaN(supporterId)) {
        //     res.status(400).send("Not a number");
        //     return;
        // }

        let categoryIds: number[] = [];
        if (req.query.categoryIds) {
            if (Array.isArray(req.query.categoryIds))
                categoryIds = (req.query.categoryIds as string[]).map(id => parseInt(id, 10));
            else
                categoryIds = [parseInt(req.query.categoryIds as string,10)]
        }
        const dbresult = await getAll(searchQuery, supportingCost, supporterId, categoryIds, ownerId, sortBy);
        const dbData = JSON.stringify(dbresult)
        for (const item of dbresult) {
            // Logger.info(item);
            // const supportTierId = await getSupportTierById(item.supporterId);
            petitions.push({
                petitionId: item.petitionId,
                title: item.title,
                categoryId:item.category_id,
                ownerId:item.owner_id,
                ownerFirstName: item.first_name,
                ownerLastName:item.last_name,
                creationDate:item.creation_date,
                supportingCost:item.supportingCost,
                supporterId:item.supporterId,
                // supporteruserid:item.supporteruserid,
                // supportTierId,
            })
        }

        const responseData = {
            count:dbresult.length,
            petitions,
        }
        if (startIndex >= 0) {
            Logger.info(`this is the count:${startIndex}`)
            const slicedPetitions = responseData.petitions.slice(startIndex, startIndex +  count);
            Logger.info(`this is the petitions:${slicedPetitions}`)
            responseData.petitions = slicedPetitions;
            res.status(200).send(responseData);
            return;
        }
        // Logger.info(`type ${ responseData.count}`)
        // Logger.info(`type ${ typeof responseData}`)
        res.status(200).send(responseData)
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}


const getPetition = async (req: Request, res: Response): Promise<void> => {
    try {
        const petitionId = parseInt(req.params.id,10); // Assuming the petitionId is provided as a route parameter
        const petition = await getPetitionById(petitionId); // Fetch the petition by its ID
        if (petition === -1) { // If petition not found
            res.statusMessage = "Petition not found";
            res.status(404).send();
            return;
        }
        res.status(200).json(petition); // Respond with the retrieved petition
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const addPetition = async (req: Request, res: Response): Promise<void> => {
    try{
        const { title, description, categoryId, supportTiers } = req.body;

        // Check if the title is empty
        Logger.info(`thisistitlt${title}`)
        const auth = req.header("X-Authorization");
        Logger.info(`thisisauth${auth}`)
        // this had auth with db??
        if (auth === undefined) {
            res.status(401).send("Not autharized");
            return;
        }
        if (!title) {
            res.status(400).send("Title cannot be empty");
            return;
        }

        if (!supportTiers) {
            res.status(400).send("supportTiers cannot be empty, or too many or cost Nan");
            return;
        }
        if (supportTiers.length > 3 ) {
            res.status(400).send("supportTiers cannot be empty, or too many or cost Nan");
            return;
        }
        for (const items of supportTiers) {
            if (typeof (items.cost) !== 'number'){
                res.status(400).send("cost must be provided");
                return
            }
        }
        Logger.info(`useridfor petition:${auth}`)
        const dbtokenresult = await getUserwithToken(auth)
        const userId = dbtokenresult[0].id
        const dbresult = await insertPetition({ userId,title, description, categoryId,supportTiers });
        Logger.info(`dbresult petition:${dbresult}`)
        const petitionId = dbresult[0].insertId;
        const supportId = dbresult[1].insertId;
        Logger.info(`This is the response${JSON.stringify(dbresult[0])}`)
        Logger.info(supportId)
        res.status(201).send({petitionId})
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const editPetition = async (req: Request, res: Response): Promise<void> => {
    try{
        const validation = await validate(schemas.petition_patch,req.body);
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
        Logger.info(`global token ${globalToken}, currentToken:${authHeader}`);
        // if (authHeader !== globalToken) {
        //     res.status(404).send("User no authenticated,mismatch");
        //     return ;
        // }
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
        // need to be dynamic??
        // const title = req.body.title;
        Logger.info(`thisiisdescription ${petition.description}`)
        const title = req.body.title || petition.title; // Keep the existing title if not provided
        const description = req.body.description || petition.description; // Keep the existing description if not provided
        const categoryId = req.body.categoryId || petition.categoryId;

        const dbresult = await updatePetition(petitionId, title, description,categoryId);

        Logger.info(dbresult)
        if (dbresult[0].affectedRows > 0 ) {
            res.status(200).send("title updated")
        } else {
            res.status(400).send("gone wrong")
        }
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const deletePetition = async (req: Request, res: Response): Promise<void> => {
    try {
        const authHeader = req.header('X-Authorization');
        if (!authHeader) {
            res.status(401).send("Unauthorized");
            return;
        }

        const petitionId = parseInt(req.params.id, 10);
        if (isNaN(petitionId)) {
            res.status(400).send("Invalid ID parameter");
            return;
        }

        // Retrieve petition details
        const petition = await getPetitionById(petitionId);
        if (!petition) {
            res.status(404).send("Petition not found");
            return;
        }

        // Check if the user is the owner of the petition
        // const userTokenDb = await getUserwithToken(authHeader);
        // const userTokenDbId = userTokenDb[0].id;
        // if (userTokenDbId !== petition.owner_id) {
        //     res.status(403).send("Forbidden: You are not the owner of this petition");
        //     return;
        // }

        // Delete the petition from the database
        const deleteResult = await deletePetitionById(petitionId);
        if (deleteResult.message) {
            res.status(403).send("Error in sql")
            return
        }
        Logger.info(`this is delete result${JSON.stringify(deleteResult)}`)
        if (deleteResult[0].affectedRows > 0) {
            res.status(200).send("Petition deleted successfully");
            // Logger.info('WHHHHHH')
            return ;
        } else {
            // Logger.info(`${deleteResult.affectedRows}`)
            res.status(403).send(`Failed to delete petition${deleteResult}`);
        }
    } catch (err) {
        Logger.error(err);
        res.status(500).send("Internal Server Error");
    }
}
const getCategories = async (req: Request, res: Response): Promise<void> => {
    try {
        const categories = await getAllCategories(); // Assuming you have a function to fetch categories
        res.status(200).json(categories); // Send categories as a JSON response
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
};



export {getAllPetitions, getPetition, addPetition, editPetition, deletePetition, getCategories};