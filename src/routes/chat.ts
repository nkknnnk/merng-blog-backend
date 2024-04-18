// @ts-nocheck
import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import {
  addMemberToGroup,
  getMyChats,
  getMyGroups,
  newGroupChat,
  removeMemberFromGroup,
  leaveGroup,
  sendAttachments,
  getChatDetails,
  renameGroup,
  deleteChat,
  getMessage,
} from "../controllers/chat";
import { attachmentMulter } from "../middlewares/multer";

const chatRoutes = express.Router();

// After here user be logged in to access the routes
chatRoutes.use(isAuthenticated);

// http://localhost:3001/chat
chatRoutes.post("/new", newGroupChat);
chatRoutes.get("/my", getMyChats);
chatRoutes.get("/myGroups", getMyGroups);
chatRoutes.put("/addMembers", addMemberToGroup);
chatRoutes.put("/removeMember", removeMemberFromGroup);
chatRoutes.put("/leave/:id", leaveGroup);

// send Attachements
chatRoutes.post("/message", attachmentMulter, sendAttachments);
chatRoutes.get("/message/:id", getMessage);

// Get Chat Details, rename, delete
chatRoutes
  .route("/:id")
  .get(getChatDetails)
  .put(renameGroup)
  .delete(deleteChat);

export default chatRoutes;
