"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMessage = exports.deleteChat = exports.renameGroup = exports.getChatDetails = exports.sendAttachments = exports.leaveGroup = exports.removeMemberFromGroup = exports.addMemberToGroup = exports.getMyGroups = exports.getMyChats = exports.newGroupChat = void 0;
const events_1 = require("../constants/events");
const features_1 = require("../utils/features");
const chat_1 = require("../models/chat");
const helper_1 = require("../lib/helper");
const User_1 = __importDefault(require("../models/User"));
const message_1 = require("../models/message");
const newGroupChat = async (req, res, next) => {
    const { name, members } = req.body;
    console.log(req.body);
    try {
        if (members.length < 2)
            return res.status(403).send({
                success: false,
                message: "A group chat must have at least three members",
            });
        const allMembers = [...members, req.userId];
        const chatGroup = await chat_1.Chat.create({
            name,
            groupChat: true,
            creator: req.userId,
            members: allMembers,
        });
        // @ts-ignore
        (0, features_1.emitEvent)(req, events_1.ALERT, allMembers, `Welcome to ${name} group!`);
        // @ts-ignore
        (0, features_1.emitEvent)(req, events_1.REFETCH_CHATS, members);
        return res.status(201).json({
            success: true,
            message: "Group created!",
            data: chatGroup,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.newGroupChat = newGroupChat;
const getMyChats = async (req, res, next) => {
    try {
        const chats = await chat_1.Chat.find({ members: req.userId }).populate("members", "name username avatar");
        console.log(chats, req.userId);
        const transformedChats = chats.map((chat) => {
            const otherMember = (0, helper_1.getOtherMember)(chat.members, req.userId);
            return {
                _id: chat._id,
                groupChat: chat.groupChat,
                avatar: chat.groupChat
                    ? chat?.members
                        .slice(0, 3)
                        .map((member) => member.avatar.url)
                    : [otherMember.avatar.url],
                name: chat.groupChat ? chat.name : otherMember.name,
                members: chat.members.reduce((prev, curr) => {
                    if (curr._id !== req.userId) {
                        prev.push(curr._id);
                    }
                    return prev;
                }, []),
            };
        });
        return res.status(200).json({
            success: true,
            chats: transformedChats,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getMyChats = getMyChats;
const getMyGroups = async (req, res, next) => {
    try {
        const chats = await chat_1.Chat.find({
            members: req.userId,
            groupChat: true,
            creator: req.userId,
        }).populate("members", "name avatar");
        const groups = chats.map(({ members, _id, groupChat, name }) => ({
            _id,
            groupChat,
            name,
            avatar: members.slice(0, 3).map(({ avatar }) => avatar.url),
        }));
        return res.status(200).json({ success: true, groups });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getMyGroups = getMyGroups;
const addMemberToGroup = async (req, res, next) => {
    const { chatId, members } = req.body;
    try {
        const chat = await chat_1.Chat.findById(chatId);
        if (!chat)
            return res
                .status(404)
                .json({ success: false, message: "Chat not found!" });
        if (!chat.groupChat)
            return res
                .status(400)
                .json({ success: false, message: "This is Not a Group Chat!" });
        if (chat.creator.toString() !== req.userId)
            return res.status(403).json({
                success: false,
                message: "You are not allowed to add members!",
            });
        const allNewMembersPromise = members.map((i) => User_1.default.findById(i));
        const allNewMembers = await Promise.all(allNewMembersPromise);
        const uniqueMembers = allNewMembers
            .filter((i) => !chat.members.includes(i._id.toString()))
            .map((i) => i._id);
        chat.members.push(...uniqueMembers.map((i) => i._id));
        if (chat.members.length > 100)
            return res
                .status(400)
                .json({ success: false, message: "Group members limit reached!" });
        chat.save();
        const allUsersName = allNewMembers.map((i) => i.name).join(",");
        (0, features_1.emitEvent)(
        //@ts-ignore
        req, events_1.ALERT, chat.members, `${allUsersName} has been added in the group!`);
        //@ts-ignore
        (0, features_1.emitEvent)(req, events_1.REFETCH_CHATS, chat.members);
        return res
            .status(200)
            .json({ success: true, message: "Members added successfully" });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.addMemberToGroup = addMemberToGroup;
const removeMemberFromGroup = async (req, res) => {
    try {
        let { userId, chatId } = req.body;
        const [chat, userThatWillBeRemoved] = await Promise.all([
            chat_1.Chat.findById(chatId),
            User_1.default.findById(userId, "name"),
        ]);
        if (!chat)
            return res
                .status(404)
                .json({ success: false, message: "Chat not found!" });
        if (!chat.groupChat)
            return res
                .status(400)
                .json({ success: false, message: "This is Not a Group Chat!" });
        if (chat.creator.toString() !== req.userId)
            return res.status(403).json({
                success: false,
                message: "Only admin can perform this action!",
            });
        if (chat.members.length <= 3)
            return res.status(400).json({
                success: false,
                message: "At least three member should be there",
            });
        chat.members = chat.members.filter((member) => member.toString() != userId.toString());
        await chat.save();
        (0, features_1.emitEvent)(
        //@ts-ignore
        req, events_1.ALERT, chat.members, 
        //@ts-ignore
        `${userThatWillBeRemoved.name} has been removed from the group`);
        //@ts-ignore
        (0, features_1.emitEvent)(req, events_1.REFETCH_CHATS, chat.members);
        return res.status(201).json({
            success: true,
            data: null,
            message: "Member removed successfully!",
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
exports.removeMemberFromGroup = removeMemberFromGroup;
const leaveGroup = async (req, res) => {
    try {
        const chatId = req.params.id;
        const chat = await chat_1.Chat.findById(chatId);
        if (!chat)
            return res
                .status(404)
                .json({ success: false, message: "Chat not found!" });
        if (!chat.groupChat)
            return res
                .status(400)
                .json({ success: false, message: "This is Not a Group Chat!" });
        const remainingMembers = chat.members.filter((member) => member.toString() !== req.userId.toString());
        if (chat.creator.toString() === req.userId.toString()) {
            const randomElement = Math.floor(Math.random() * remainingMembers.length + 1);
            const newCreator = remainingMembers[randomElement];
            chat.creator = newCreator;
        }
        chat.members = remainingMembers;
        await chat.save();
        //@ts-ignore
        (0, features_1.emitEvent)(req, events_1.ALERT, chat.members, `You have been removed`);
        //@ts-ignore
        (0, features_1.emitEvent)(req, events_1.REFETCH_CHATS, chat.members);
        return res.status(201).json({
            success: true,
            data: null,
            message: "You have leaved!",
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
exports.leaveGroup = leaveGroup;
// Send Attachments
const sendAttachments = async (req, res) => {
    try {
        const { chatId } = req.body;
        const [chat, user] = await Promise.all([
            chat_1.Chat.findById(chatId),
            User_1.default.findById(req.userId, "name"),
        ]);
        if (!chat)
            return res.status(404).json({
                success: false,
                message: "Chat not found",
            });
        const files = req.files || [];
        if (files.length === 0)
            return res.status(400).json({
                success: false,
                message: "No files Provided, Please provide attachements",
            });
        // Upload file on cloudinary
        const attachments = await (0, features_1.uploadFilesToCloudinary)(files);
        // const attachments = [];
        const messageForDB = {
            content: "",
            attachments,
            sender: { _id: user?._id, name: user?.name },
            chat: chatId,
        };
        const messageForRealTime = {
            ...messageForDB,
            sender: { _id: user?._id, name: user?.name },
        };
        const message = await message_1.Message.create(messageForDB);
        //@ts-ignore
        (0, features_1.emitEvent)(req, events_1.NEW_MESSAGE, chat.members, {
            message: messageForRealTime,
            chatId,
        });
        //@ts-ignore
        (0, features_1.emitEvent)(req, events_1.NEW_MESSAGE_ALERT, chat.members, {
            chatId,
        });
        return res.status(201).json({
            success: true,
            message: message,
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
exports.sendAttachments = sendAttachments;
// Get Chat Details, rename, delete
const getChatDetails = async (req, res) => {
    try {
        if (req.query.populate === "true") {
            const chat = await chat_1.Chat.findById(req.params.id)
                .populate("members", "name avatar")
                .lean();
            if (!chat)
                throw new Error("Chat not found");
            //@ts-ignore
            chat.members = chat.members.map(({ _id, name, avatar }) => ({
                _id,
                name,
                avatar: avatar.url,
            }));
            return res.status(200).json({
                success: true,
                data: chat,
            });
        }
        else {
            const chat = await chat_1.Chat.findById(req.params.id);
            if (!chat)
                throw new Error("No such chat exists");
            return res.status(200).json({
                success: true,
                chat,
            });
        }
    }
    catch (e) {
        return res.status(400).json({
            err: e.message,
        });
    }
};
exports.getChatDetails = getChatDetails;
const renameGroup = async (req, res) => {
    try {
        const chatId = req.params.id;
        const { name } = req.body;
        let chat = await chat_1.Chat.findById(chatId);
        if (!chat) {
            throw new Error("Invalid Chat ID");
        }
        if (!chat.groupChat)
            return res
                .status(401)
                .json({ success: false, message: "This is Not a Group Chat" }); // Not a group chat
        if (chat.creator.toString() != req.userId.toString())
            return res
                .status(403)
                .send("You are not authorized to perform this action");
        chat.name = name;
        await chat.save();
        //@ts-ignore
        (0, features_1.emitEvent)(req, events_1.REFETCH_CHATS, chat.members);
        return res
            .status(200)
            .json({ success: true, message: "Group renamed Successfully" });
    }
    catch (e) {
        return res.status(500).json({
            err: e.message,
        });
    }
};
exports.renameGroup = renameGroup;
const deleteChat = async (req, res) => {
    try {
        const chatId = req.params.id;
        const chat = await chat_1.Chat.findById(chatId);
        if (!chat) {
            throw new Error("No such chat exists");
        }
        if (chat.groupChat && chat.creator.toString() !== req.userId.toString()) {
            // Checking whether the user is the creator of the chat or not
            return res.status(401).json({
                success: false,
                message: "Unauthorised Access",
            });
        }
        if (!chat.groupChat && !chat.members.includes(req.userId.toString())) {
            // If it's a one-on-one chat and the logged in user is not part of that conversation then he/she can't delete it
            return res.status(401).json({
                success: false,
                message: "User is not a member of this chat ",
            });
        }
        const messagesWithAttachments = await message_1.Message.find({
            chat: chatId,
            attachments: { $exists: true, $ne: [] },
        });
        const public_ids = [];
        messagesWithAttachments.forEach((message) => {
            message.attachments.forEach((attachment) => {
                public_ids.push(attachment.public_id);
            });
        });
        await Promise.all([
            //  Removing all the messages with attachment from cloudinary
            (0, features_1.deleteFilesFromCloudinary)(public_ids),
            chat.deleteOne(),
            message_1.Message.deleteMany({ chat: chatId }),
        ]);
        //@ts-ignore
        (0, features_1.emitEvent)(req, events_1.REFETCH_CHATS, chat.members);
        res.status(200).json({
            success: true,
            message: `Deleted chat ${chatId}`,
        });
    }
    catch (e) {
        return res.status(500).json({
            err: e.message,
        });
    }
};
exports.deleteChat = deleteChat;
const getMessage = async (req, res) => {
    try {
        const chatId = req.params.id;
        const { page = 1 } = req.query;
        const limit = 20;
        const skip = (page - 1) * limit;
        const [messages, totalMessagesCount] = await Promise.all([
            message_1.Message.find({ chat: chatId })
                .sort("createdAt")
                .skip(skip)
                .limit(limit)
                .populate("sender", "name avatar")
                .lean(),
            message_1.Message.countDocuments({ chat: chatId }),
        ]);
        const totalPages = Math.ceil(totalMessagesCount / limit);
        return res.status(200).json({
            success: true,
            messages: messages.reverse(),
            totalPages,
        });
    }
    catch (e) {
        return res.status(500).json({
            err: e.message,
        });
    }
};
exports.getMessage = getMessage;
//# sourceMappingURL=chat.js.map