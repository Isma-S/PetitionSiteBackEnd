import {Request, Response} from "express";
import * as schemas from '../resources/schemas.json';
import * as Petition from "../models/petition.model";
import * as Supporter from '../models/supporter.model';
import Logger from "../../config/logger";
import {validate} from "../services/validator";

const addSupportTier = async (req: Request, res: Response): Promise<void> => {
    try {
        const validation = await validate(schemas.support_tier_post, req.body);
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
        if (petition.ownerId !== req.authId) {
            res.statusMessage = "Cannot modify another user's petition"
            res.status(403).send();
            return;
        }
        if (petition.supportTiers.length >= 3) {
            res.statusMessage = "A petition can only have a maximum of 3 support tiers"
            res.status(403).send();
            return;
        }
        const added: boolean = await Petition.addSupportTier(petitionId, req.body.title, req.body.description, req.body.cost);
        if (added) {
            res.status(201).send();
            return;
        } else {
            // todo: this feels like a proper edge case to catch
            res.statusMessage = "Could not add support tier";
            res.status(500).send();
            return;
        }
    } catch (err) {
        Logger.error(err);
        if (err.errno === 1062) { // 1062 = Duplicate entry MySQL error number
            res.statusMessage = "Forbidden: Duplicate support tier";
            res.status(403).send();
            return;
        } else {
            res.statusMessage = "Internal Server Error";
            res.status(500).send();
            return;
        }
    }
}

const editSupportTier = async (req: Request, res: Response): Promise<void> => {
    try {
        const validation = await validate(schemas.support_tier_patch, req.body);
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
        const supportTierId: number = parseInt(req.params.tierId, 10);
        if (isNaN(supportTierId)) {
            res.statusMessage = "supportTierId must be an integer";
            res.status(400).send();
            return;
        }
        const petition: petitionFull = await Petition.getOne(petitionId);
        if (petition == null) {
            res.statusMessage = "Petition does not exist";
            res.status(404).send();
            return;
        }
        const supportTierToUpdate: supportTier = petition.supportTiers.find(s => s.supportTierId === supportTierId)
        if (!supportTierToUpdate) {
            res.statusMessage = "Support tier does not exist on petition";
            res.status(404).send();
            return;
        }
        if (petition.ownerId !== req.authId) {
            res.statusMessage = "Cannot modify another user's petition"
            res.status(403).send();
            return;
        }
        const supporters: supporter[] = await Supporter.getSupportersForTier(supportTierId);
        if (supporters.length !== 0) {
            res.statusMessage = "Can not edit a support tier if one or more users have supported it";
            res.status(403).send();
            return;
        }
        let title: string = supportTierToUpdate.title;
        if (req.body.hasOwnProperty("title")) {
            title = req.body.title;
        }
        let description: string = supportTierToUpdate.description;
        if (req.body.hasOwnProperty("description")) {
            description = req.body.description;
        }
        let cost: number = supportTierToUpdate.cost;
        if (req.body.hasOwnProperty("cost")) {
            cost = req.body.cost;
        }
        const updated: boolean = await Petition.editSupportTier(supportTierId, title, description, cost)
        if (updated) {
            res.status(200).send();
            return;
        } else {
            Logger.error("Could not edit support tier");
            res.statusMessage = "Could not edit support tier";
            res.status(500).send();
            return;
        }
    } catch (err) {
        Logger.error(err);
        if (err.errno === 1062) { // 1062 = Duplicate entry MySQL error number
            res.statusMessage = "Forbidden: Duplicate support tier";
            res.status(403).send();
            return;
        } else {
            res.statusMessage = "Internal Server Error";
            res.status(500).send();
            return;
        }
    }
}

const deleteSupportTier = async (req: Request, res: Response): Promise<void> => {
    try {
        const petitionId: number = parseInt(req.params.id, 10);
        if (isNaN(petitionId)) {
            res.statusMessage = "petitionId must be an integer";
            res.status(400).send();
            return;
        }
        const supportTierId: number = parseInt(req.params.tierId, 10);
        if (isNaN(supportTierId)) {
            res.statusMessage = "supportTierId must be an integer";
            res.status(400).send();
            return;
        }
        const petition: petitionFull = await Petition.getOne(petitionId);
        if (petition == null) {
            res.statusMessage = "Petition does not exist";
            res.status(404).send();
            return;
        }
        if (!petition.supportTiers.find(s => s.supportTierId === supportTierId)) {
            res.statusMessage = "Support tier does not exist on petition";
            res.status(404).send();
            return;
        }
        if (petition.ownerId !== req.authId) {
            res.statusMessage = "Cannot modify another user's petition";
            res.status(403).send();
            return;
        }
        if (petition.supportTiers.length === 1) {
            res.statusMessage = "A petition must have at least 1 support tier";
            res.status(403).send();
            return;
        }
        const supporters: supporter[] = await Supporter.getSupportersForTier(supportTierId);
        if (supporters.length !== 0) {
            res.statusMessage = "Can not delete a support tier if one or more users have supported it";
            res.status(403).send();
            return;
        }
        const deleted: boolean = await Petition.deleteSupportTier(supportTierId);
        if (deleted) {
            res.status(200).send();
            return;
        } else {
            Logger.error("Could not delete support tier");
            res.statusMessage = "Could not delete support tier";
            res.status(500).send();
        }
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

export {addSupportTier, editSupportTier, deleteSupportTier};