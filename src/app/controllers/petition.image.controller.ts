import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as users from "../models/user.image.server.model";
import path from "path";
import mime from "mime";
import {getPetitionById, insertPetitionImage} from "../models/petition.server.model";
import fs from "mz/fs";
const filepath = "../../../storage/images"
const getImage = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id, 10);
        const dbresult = await getPetitionById(id);
        if (dbresult.length === 0) {
            res.status(404).send(`Petition with id:${id} doesn't exist`);
            return;
        }

        const imageName = dbresult.image_filename;
        if (!imageName) {
            res.status(404).send("No image found for this petition");
            return;
        }

        const imageDirectory = path.join(__dirname, filepath);
        const imagePath = path.join(imageDirectory, imageName);
        Logger.info(`petition:${imagePath}`);

        const contentType = mime.lookup(imagePath); // Getting MIME type from file path
        if (!contentType) {
            res.status(500).send("Internal Server Error: Unable to determine image content type");
            return;
        }

        res.setHeader("Content-Type", contentType);
        res.sendFile(imagePath);
    } catch (err) {
        Logger.error(err);
        res.status(500).send("Internal Server Error");
    }
};


const setImage = async (req: Request, res: Response): Promise<void> => {
    try {
        const image = req.body;
        // Check if request contains file
        if (!image) {
            res.status(400).send("No file uploaded");
            return;
        }
        const id = parseInt(req.params.id,10);
        const imageHeader = req.header("Content-Type");
        const imageType = imageHeader.split('/')[1];
        // Assuming you have a directory to save images
        const uploadDirectory = path.join(__dirname, filepath);

        // Check if the directory exists, if not, create it
        if (!fs.existsSync(uploadDirectory)) {
            fs.mkdirSync(uploadDirectory, { recursive: true });
        }

        // Assuming you want to save the file with the original name
        const imageName = `petition_${id}.${imageType}`;
        const filePath = path.join(uploadDirectory, imageName);
        Logger.info("writing image to dir")
        // Move the uploaded file to the specified directory
        try {
            // Logger.info(`Image moved to:${imagePath}`)
            await fs.writeFile(filePath, image);
            Logger.info(`Image moved to:${filePath}`)
            const dbresult = await insertPetitionImage(imageName,id);
            Logger.info(`Image moved to:${typeof image}`)
            if (dbresult && dbresult.affectedRows > 0) {
                if (imageType === "jpeg") {
                    res.status(201).send("Image file name set successfully");
                } else if (imageType === "gif") {
                    res.status(200).send("Image file name set successfully");
                } else {
                    res.status(400).send(`Unsupported image type: ${imageType}`);
                }
            } else {
                res.status(403).send(`User id:${id} doesn't exist`);
            }
            Logger.info("written file successfully");
        } catch (err) {
            Logger.error("Error writing image to folder",err);
        }
    } catch (err) {
        Logger.error(err);
        res.status(500).send("Internal Server Error");
    }
};


export {getImage, setImage};