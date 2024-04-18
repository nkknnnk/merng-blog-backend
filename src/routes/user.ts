// @ts-nocheck

import express from "express";
import { acceptRequest, getAllNotifications, getMyFriends, getMyProfile, login, logout, newUser, searchUser, sendRequest } from "../controllers/user";
import { multerUpload } from "../middlewares/multer";
// import { errorMiddleware } from "../middlewares/error";
import { isAuthenticated } from "../middlewares/auth";

const userRoutes = express.Router();

// http://localhost:3001/users
userRoutes.post("/new", multerUpload.single("avatar"), newUser); // Upload image and create a new user
userRoutes.post("/login", login); // Login with email and password to

// After here user must be logged in to  access these routes
userRoutes.use(isAuthenticated);
userRoutes.get("/me", getMyProfile); // Get the profile of the authenticated
userRoutes.get("/logout", logout);
userRoutes.get("/search", searchUser);
userRoutes.post("/sendrequest", sendRequest)
userRoutes.post("/acceptrequest", acceptRequest)
userRoutes.get("/getMyNotification", getAllNotifications)
userRoutes.get("/getMyFriends", getMyFriends)
export default userRoutes;
