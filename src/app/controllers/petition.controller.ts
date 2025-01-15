import {Request, Response} from "express";
import Logger from '../../config/logger';
import * as schemas from '../resources/schemas.json';
import * as Petition from '../models/petition.model'
import * as Image from '../models/images.model';
import {validate} from "../services/validator";
import {ResultSetHeader} from "mysql2";
import * as Supporter from "../models/supporter.model";

const getAllPetitions = async (req: Request, res: Response): Promise<void> => {
    try {
        const validation = await validate(schemas.petition_search, req.query);
        if (validation !== true) {
            res.statusMessage = `Bad Request: ${validation.toString()}`;
            res.status(400).send();
            return;
        }

        if (req.query.hasOwnProperty("ownerId"))
            req.query.ownerId = parseInt(req.query.ownerId as string, 10) as any;
        if (req.query.hasOwnProperty("supporterId"))
            req.query.supporterId = parseInt(req.query.supporterId as string, 10) as any;
        if (req.query.hasOwnProperty("supportingCost"))
            req.query.supportingCost = parseInt(req.query.supportingCost as string, 10) as any;
        if (req.query.hasOwnProperty("startIndex"))
            req.query.startIndex = parseInt(req.query.startIndex as string, 10) as any;
        if (req.query.hasOwnProperty("count"))
            req.query.count = parseInt(req.query.count as string, 10) as any;
        if (req.query.hasOwnProperty("categoryIds")) {
            if (!Array.isArray(req.query.categoryIds))
                req.query.categoryIds = [parseInt(req.query.categoryIds as string, 10)] as any;
            else
                req.query.categoryIds = (req.query.categoryIds as string[]).map((x: string) => parseInt(x, 10)) as any;
            const categories: category[] = await Petition.getCategories();
            if (!(req.query.categoryIds as any as number[]).every(c => categories.map(x => x.categoryId).includes(c))) {
                res.statusMessage = `Bad Request: No category with id`;
                res.status(400).send();
                return;
            }
        }

        let search: petitionSearchQuery = {
            q: '',
            ownerId: -1,
            supporterId: -1,
            supportingCost: -1,
            categoryIds: [],
            sortBy: 'CREATED_ASC',
            startIndex: 0,
            count: -1
        }
        search = {...search, ...req.query} as petitionSearchQuery;

        const petitions: petitionReturn = await Petition.viewAll(search);
        res.status(200).send(petitions);
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}


const getPetition = async (req: Request, res: Response): Promise<void> => {
    try {
        const petitionId: number = parseInt(req.params.id, 10);
        if (isNaN(petitionId)){
            res.statusMessage = "Id must be an integer"
            res.status(400).send();
            return;
        }
        const petition: petitionFull = await Petition.getOne(petitionId);
        if(petition != null) {
            res.status(200).send(petition);
            return ;
        } else {
            res.status(404).send();
            return
        }
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

const addPetition = async (req: Request, res: Response): Promise<void> => {
    try {
        const validation = await validate(schemas.petition_post, req.body);
        if(validation !== true) {
            res.statusMessage = `Bad Request: ${validation.toString()}`;
            res.status(400).send();
            return;
        }
        const d: Date = new Date()
        const creationDate: string = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()} ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`
        const categories: category[] = await Petition.getCategories();
        if (!categories.find(c => c.categoryId === req.body.categoryId)) {
            res.statusMessage = "No category with id";
            res.status(400).send();
            return;
        }

        const seenValues: Set<string> = new Set();
        const hasDuplicateSupportTierTitle = req.body.supportTiers.some((st: { title: string; }) => {
            if(seenValues.has(st.title)) {
                return true;
            }
            seenValues.add(st.title);
            return false;
        })

        if (hasDuplicateSupportTierTitle) {
           res.statusMessage = "supportTiers must have unique titles";
           res.status(400).send();
           return;
        }

        const result: ResultSetHeader = await Petition.addOne(req.authId, req.body.title, req.body.description, creationDate, req.body.categoryId, req.body.supportTiers)
        if (result) {
            res.status(201).send({"petitionId": result.insertId});
            return;
        } else {
            // todo: this feels like a proper edge case to catch
            res.statusMessage = "Petition could not be saved";
            res.status(500).send();
            return;
        }
    } catch (err) {
        Logger.error(err);
        if (err.errno === 1062) { // 1062 = Duplicate entry MySQL error number
            res.statusMessage = "Forbidden: Duplicate petition";
            res.status(403).send();
            return;
        } else {
            res.statusMessage = "Internal Server Error";
            res.status(500).send();
            return;
        }
    }
}

const editPetition = async (req: Request, res: Response): Promise<void> => {
    try {
        const validation = await validate(schemas.petition_patch, req.body);
        if(validation !== true) {
            res.statusMessage = `Bad Request: ${validation.toString()}`;
            res.status(400).send();
            return;
        }

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
        if (petition.ownerId !== req.authId) {
            res.statusMessage = "Cannot edit another user's petition";
            res.status(403).send();
            return;
        }
        let title: string = petition.title;
        if (req.body.hasOwnProperty("title")) {
            title = req.body.title;
        }
        let description: string = petition.description;
        if (req.body.hasOwnProperty("description")) {
            description = req.body.description;
        }

        let categoryId: number = petition.categoryId;
        if (req.body.hasOwnProperty("categoryId")){
            const categories = await Petition.getCategories();
            if (!categories.find(c=> c.categoryId === req.body.categoryId)) {
                res.statusMessage = "No category with id";
                res.status(400).send();
                return;
            } else {
                categoryId = req.body.categoryId;
            }
        }

        const result: boolean = await Petition.editOne(petitionId, title, description, categoryId);
        if (result) {
            res.status(200).send();
            return;
        } else {
            // todo: what could cause this case?
            Logger.warn("Petition could not be updated");
            res.statusMessage = "Petition could not be updated";
            res.status(500).send();
        }
    } catch (err) {
        Logger.error(err)
        if (err.errno === 1062) { // 1062 = Duplicate entry MySQL error number
            res.statusMessage = "Forbidden: Duplicate petition";
            res.status(403).send();
            return;
        } else {
            res.statusMessage = "Internal Server Error";
            res.status(500).send();
            return;
        }
    }
}

const deletePetition = async (req: Request, res: Response): Promise<void> => {
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
        if (petition.ownerId !== req.authId) {
            res.statusMessage = "Cannot edit another user's petition";
            res.status(403).send();
            return;
        }
        const supporters: supporter[] = await Supporter.getSupporters(petitionId);
        if (supporters.length !== 0) {
            res.statusMessage = "Can not delete a petition if one or more users have supported it";
            res.status(403).send();
            return;
        }
        const filename: string = await Petition.getImageFilename(petitionId);
        const result: boolean = await Petition.deleteOne(petitionId);
        if(result) {
            if(filename!==null && filename!=="") {
                await Image.removeImage(filename)
            }
            res.status(200).send();
            return;
        } else {
            // todo: what could cause this case?
            Logger.error("Could not delete petition")
            res.statusMessage = "Could not delete petition";
            res.status(500).send();
            return;
        }
    } catch (err) {
        Logger.error(err)
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const getCategories = async(req: Request, res: Response): Promise<void> => {
    try {
        const categories: category[] = await Petition.getCategories();
        res.status(200).send(categories);
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

export {getAllPetitions, getPetition, addPetition, editPetition, deletePetition, getCategories};