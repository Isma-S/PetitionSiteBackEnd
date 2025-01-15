import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as Petitions from "../models/petition.model";
import {addImage, readImage, removeImage} from "../models/images.model";
import {getImageExtension} from "../models/imageTools";

const getImage = async (req: Request, res: Response): Promise<void> => {
    try {
        const petitionId: number = parseInt(req.params.id, 10);
        if (isNaN(petitionId)) {
            res.statusMessage = "Id must be an integer"
            res.status(400).send();
            return;
        }
        const filename: string = await Petitions.getImageFilename(petitionId)
        if(filename == null) {
            res.status(404).send();
            return;
        }
        const [image, mimetype]  = await readImage(filename)
        res.status(200).contentType(mimetype).send(image)
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

const setImage = async (req: Request, res: Response): Promise<void> => {
    try{
        let isNew:boolean = true;
        const petitionId: number = parseInt(req.params.id, 10);
        if (isNaN(petitionId)) {
            res.statusMessage = "Id must be an integer"
            res.status(400).send();
            return;
        }
        const image = req.body;
        const petition: petitionFull = await Petitions.getOne(petitionId);
        if (petition == null){
            res.statusMessage = "No such petition"
            res.status(404).send();
            return;
        }
        if(req.authId !== petition.ownerId) {
            res.statusMessage = "Cannot modify another user's petition";
            res.status(403).send();
            return;
        }
        const mimeType: string = req.header('Content-Type');
        const fileExt: string = getImageExtension(mimeType);
        if (fileExt == null) {
            res.statusMessage = 'Bad Request: photo must be image/jpeg, image/png, image/gif type, but it was: ' + mimeType;
            res.status(400).send();
            return;
        }

        if (image.length === undefined) {
            res.statusMessage = 'Bad request: empty image';
            res.status(400).send();
            return;
        }

        const filename: string = await Petitions.getImageFilename(petitionId);
        if(filename != null && filename !== "") {
            await removeImage(filename);
            isNew = false;
        }
        const newFilename: string = await addImage(image, fileExt);
        await Petitions.setImageFilename(petitionId, newFilename);
        if(isNew) {
            res.status(201).send()
            return;
        } else {
            res.status(200).send()
            return;
        }
    } catch (err) {
        Logger.error(err)
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}


export {getImage, setImage};