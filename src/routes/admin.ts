// @ts-nocheck
import express from "express";
import { allChats, allMessages, allUsers, getDashboardStats } from "../controllers/admin";
const adminRoutes = express.Router();
adminRoutes.get("/");
adminRoutes.post("/verify");
adminRoutes.get("/logout");
adminRoutes.get("/users", allUsers);
adminRoutes.get("/chats", allChats);
adminRoutes.get("/messages", allMessages);
adminRoutes.get("/stats", getDashboardStats);
export default adminRoutes;
