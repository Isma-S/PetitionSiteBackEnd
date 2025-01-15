import {Request, Response} from "express";
import * as schemas from '../resources/schemas.json';
import * as Petition from "../models/petition.model"
import * as Supporters from "../models/supporter.model"
import Logger from "../../config/logger";
import {validate} from "../services/validator";


const getAllSupportersForPetition = async (req: Request, res: Response): Promise<void> => {
    try {
        const petitionId: number = parseInt(req.params.id, 10);
        if (isNaN(petitionId)) {
            res.statusMessage = "id must be an integer";
            res.status(400).send();
            return;
        }
        const petition: petitionFull = await Petition.getOne(petitionId);
        if (petition == null) {
            res.status(404).send();
            return;
        }
        const supporters: supporter[] = await Supporters.getSupporters(petitionId)
        res.status(200).send(supporters);
    } catch (err) {
        Logger.warn(err)
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const addSupporter = async (req: Request, res: Response): Promise<void> => {
    try {
        const validation = await validate(schemas.support_post, req.body);
        if (validation !== true) {
            res.statusMessage = `Bad Request: ${validation.toString()}`;
            res.status(400).send();
            return;
        }
        const petitionId: number = parseInt(req.params.id, 10);
        if (isNaN(petitionId)) {
            res.statusMessage = "petitionId must be an integer";
            res.status(400).send();
            return;
        }
        const petition: petitionFull = await Petition.getOne(petitionId);
        if (petition == null) {
            res.statusMessage = "Petition does not exist";
            res.status(404).send();
            return;
        }
        if (petition.ownerId === req.authId) {
            res.statusMessage = "Cannot support your own petition"
            res.status(403).send();
            return;
        }
        if (!petition.supportTiers.find(s => s.supportTierId === req.body.supportTierId)) {
            res.statusMessage = "Support tier does not exist";
            res.status(404).send();
            return;
        }
        let message = null;
        if (req.body.hasOwnProperty("message")) {
            message = req.body.message;
        }

        const added: boolean = await Supporters.addSupporter(petitionId, req.authId, req.body.supportTierId, message)
        if (added) {
            res.status(201).send();
            return;
        } else {
            // todo what could cause this?
            res.statusMessage = "Could not add support for petition"
            res.status(500).send()

        }
    } catch (err) {
        if (err.errno === 1062) { // 1062 = Duplicate entry MySQL error number
            res.statusMessage = "Forbidden: Duplicate supporter";
            res.status(403).send();
            return;
        } else {
            Logger.warn(err)
            res.statusMessage = "Internal Server Error";
            res.status(500).send();
            return;
        }
    }
}

export {getAllSupportersForPetition, addSupporter}