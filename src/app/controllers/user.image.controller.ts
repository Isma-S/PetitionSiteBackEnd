import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as users from "../models/user.image.server.model";
import {getUserwithId} from "../models/user.image.server.model";
import {validate} from "../resources/validate";
import * as schemas from "../resources/schemas.json";
import logger from "../../config/logger";
import fs from "mz/fs";
import path from "path";
import mime from "mime";

const getImage = async (req: Request, res: Response): Promise<void> => {
    try{
        const id = parseInt(req.params.id,10);
        const dbresult = await users.getUserwithId(id);
        if (dbresult.length === 0) {
            res.status(404).send(`User id:${id} doesnt exist`);
            return;
        }
        Logger.info(`ssss${dbresult}`)
        const userdb = dbresult[0];
        const imageName = userdb.image_filename;
        Logger.info(`type?${imageName}`)
        if (imageName === null) {
            res.status(404).send("no image yet");
            return;
        }
        const imageType = imageName.split('.')[1];
        // const imageName = `${id}.${imageType}`;
        const imageDirectory= path.join(__dirname, "../isa50/storage/images");
        const imagePath = path.join(imageDirectory,imageName);
        // const temp = req.header("Content-Type");
        // set the content type to image??
        // Logger.info(`ssss${typeof image}`)
        Logger.info(`ssss${imageType}`)
        // need to be sorted??
        const contentType = mime.lookup(imageType)
        Logger.info(`mime ${contentType}`)
        res.setHeader("Content-Type",contentType);
        res.sendFile(imagePath)

    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const setImage = async (req: Request, res: Response): Promise<void> => {
    try{
        const validation = await validate(schemas.user_edit, req.body);
        if (validation !== true) {
            res.statusMessage = `Bad Request:  ${validation.toString()}`;
            res.status(400).send();
            return ;
        }
        const id = parseInt(req.params.id,10);
        const imageHeader = req.header("Content-Type");
        const imageType = imageHeader.split('/')[1];
        Logger.info(`This is the headerfor image type:${imageType}??`)
        const image = req.body;
        const imageDirectory= path.join(__dirname, "../isa50/storage/images");
        Logger.info(`Image uploaded to image directory:${imageDirectory}`)
        const imageName = `user_${id}.${imageType}`;
        Logger.info(`Image uploaded to image name:${imageName}`)
        const imagePath = path.join(imageDirectory,imageName);
        Logger.info(`Image uploaded to:${imagePath}`)
        await fs.promises.mkdir(imageDirectory, {recursive:true});
        try {
            // Logger.info(`Image moved to:${imagePath}`)
            await fs.promises.writeFile(imagePath, image);
            Logger.info(`Image moved to:${typeof image}`)
            const dbresult = await users.insertImage(imageName,id);
            // Logger.info(`dbresult:${JSON.stringify(dbresult)}`)
            if (dbresult.affectedRows > 0) {
                res.status(201).send("image file name set successfully");
            } else {
                res.status(403).send(`User id:${id} doesnt exist`);
            }
            Logger.info("written file successfully");
        } catch (err) {
            Logger.error("Error writing image to folder",err);
        }

    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const deleteImage = async (req: Request, res: Response): Promise<void> => {
    try{
        const validation = await validate(schemas.user_edit, req.body);
        if (validation !== true) {
            res.statusMessage = `Bad Request:  ${validation.toString()}`;
            res.status(400).send();
            return ;
        }
        const id = parseInt(req.params.id,10);
        const authHeader = req.header('X-Authorization').toString();
        if (isNaN(id)) {
            res.status(400).send(`Bad Request: Id is not a number`);
            return;
        }
        Logger.info(`Userid:${id}`)
        const result = await users.getUserwithId(id);
        if (result.length === 0) {
            res.status(404).send('User not found');
        }
        // not sure if username needs to b modified??
        const user = result[0];
        // This is not passing when running as collection??
        const tokenDb = user.auth_token;
        if (authHeader === tokenDb) {
            Logger.info(`authenticated and deleting`);
            // look into storage and delete physical image??
            const dbresult = await users.deleteImage(id);
            if (dbresult.affectedRows > 0) {
                res.status(200).send("successfully deleted image");
            } else {
                res.status(404).send("errorrr")
            }
            return;
        } else {
            Logger.info(`mismatch authen`);
            res.status(403).send("Unauthrised User");
        };

    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

export {getImage, setImage, deleteImage}