"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_routes_1 = require("./base.routes");
const petition = __importStar(require("../controllers/petition.controller"));
const petitionImage = __importStar(require("../controllers/petition.image.controller"));
const supportTiers = __importStar(require("../controllers/petition.support_tier.controller"));
const supporter = __importStar(require("../controllers/petition.supporter.controller"));
module.exports = (app) => {
    app.route(base_routes_1.rootUrl + '/petitions')
        .get(petition.getAllPetitions)
        .post(petition.addPetition);
    app.route(base_routes_1.rootUrl + '/petitions/categories')
        .get(petition.getCategories);
    app.route(base_routes_1.rootUrl + '/petitions/:id')
        .get(petition.getPetition)
        .patch(petition.editPetition)
        .delete(petition.deletePetition);
    app.route(base_routes_1.rootUrl + '/petitions/:id/image')
        .get(petitionImage.getImage)
        .put(petitionImage.setImage);
    app.route(base_routes_1.rootUrl + '/petitions/:id/supportTiers')
        .put(supportTiers.addSupportTier);
    app.route(base_routes_1.rootUrl + '/petitions/:id/supportTiers/:tierId')
        .patch(supportTiers.editSupportTier)
        .delete(supportTiers.deleteSupportTier);
    app.route(base_routes_1.rootUrl + '/petitions/:id/supporters')
        .get(supporter.getAllSupportersForPetition)
        .post(supporter.addSupporter);
};
//# sourceMappingURL=petition.routes.js.map