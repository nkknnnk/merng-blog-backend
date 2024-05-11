"use strict";
// @ts-nocheck
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_1 = require("../controllers/user");
const multer_1 = require("../middlewares/multer");
// import { errorMiddleware } from "../middlewares/error";
const auth_1 = require("../middlewares/auth");
const userRoutes = express_1.default.Router();
// http://localhost:3001/users
userRoutes.post("/new", multer_1.multerUpload.single("avatar"), user_1.newUser); // Upload image and create a new user
userRoutes.post("/login", user_1.login); // Login with email and password to
// After here user must be logged in to  access these routes
userRoutes.use(auth_1.isAuthenticated);
userRoutes.get("/allUsers", user_1.getAllUsers);
userRoutes.get("/me", user_1.getMyProfile); // Get the profile of the authenticated
userRoutes.get("/logout", user_1.logout);
userRoutes.get("/search", user_1.searchUser);
userRoutes.post("/sendrequest", user_1.sendRequest);
userRoutes.post("/acceptrequest", user_1.acceptRequest);
userRoutes.get("/getMyNotification", user_1.getAllNotifications);
userRoutes.get("/getMyFriends", user_1.getMyFriends);
exports.default = userRoutes;
//# sourceMappingURL=user.js.map