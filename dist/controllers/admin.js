"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardStats = exports.allMessages = exports.allChats = exports.allUsers = void 0;
const chat_1 = require("../models/chat");
const message_1 = require("../models/message");
const User_1 = __importDefault(require("../models/User"));
const allUsers = async (req, res) => {
    try {
        let users = await User_1.default.find({});
        const transformedUsers = await Promise.all(users.map(async ({ name, username, avatar, _id }) => {
            const [groups, friends] = await Promise.all([
                chat_1.Chat.countDocuments({ groupChat: true, members: _id }),
                chat_1.Chat.countDocuments({ groupChat: false, members: _id }),
            ]);
            return {
                name,
                username,
                avatar: avatar.url,
                _id,
                groups,
                friends,
            };
        }));
        return res.status(200).json({ success: true, users: transformedUsers });
    }
    catch (error) {
        console.log(error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.allUsers = allUsers;
const allChats = async (req, res) => {
    try {
        const chats = await chat_1.Chat.find({})
            .populate("members", "name avatar")
            .populate("creator", "name avatar");
        const transformedChats = await Promise.all(chats.map(async ({ members, _id, groupChat, name, creator }) => {
            const totalMessages = await message_1.Message.countDocuments({ chat: _id });
            return {
                _id,
                groupChat,
                name,
                avatar: members.slice(0, 3).map((member) => member.avatar.url),
                members: members.map(({ _id, name, avatar }) => ({
                    _id,
                    name,
                    avatar: avatar.url,
                })),
                creator: {
                    name: creator?.name || "None",
                    avatar: creator?.avatar.url || "",
                },
                totalMembers: members.length,
                totalMessages,
            };
        }));
        return res.status(200).json({ success: true, transformedChats });
    }
    catch (error) {
        console.log(error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.allChats = allChats;
const allMessages = async (req, res) => {
    try {
        const messages = await message_1.Message.find({})
            .populate("sender", "name avatar")
            .populate("chat", "groupChat");
        const transformedMessages = messages.map(({ content, attachments, _id, sender, createdAt, chat }) => ({
            _id,
            attachments,
            content,
            createdAt,
            chat: chat._id,
            groupChat: chat.groupChat,
            sender: {
                _id: sender._id,
                name: sender.name,
                avatar: sender.avatar.url,
            },
        }));
        return res
            .status(200)
            .json({ success: true, messages: transformedMessages });
    }
    catch (error) {
        console.log(error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.allMessages = allMessages;
const getDashboardStats = async (req, res) => {
    try {
        const [groupsCount, usersCount, messagesCount, totalChatCount] = await Promise.all([
            chat_1.Chat.countDocuments({ groupChat: true }),
            User_1.default.countDocuments(),
            message_1.Message.countDocuments(),
            chat_1.Chat.countDocuments(),
        ]);
        const today = new Date();
        const last7Days = new Date();
        last7Days.setDate(today.getDate() - 7);
        const last7DayMessages = await message_1.Message.find({
            createdAt: { $gte: last7Days, $lte: today },
        }).select("createdAt");
        const messages = new Array(7).fill(0);
        const dayInMiliseconds = 1000 * 60 * 60 * 24;
        last7DayMessages.forEach((message) => {
            const indexApprox = (today.getTime() - message.createdAt.getTime()) / dayInMiliseconds;
            const index = Math.floor(indexApprox);
            messages[6 - index]++;
        });
        const stats = {
            groupsCount,
            usersCount,
            messagesCount,
            totalChats: totalChatCount,
            messagesChart: messages,
        };
        return res.status(200).json({ success: true, stats });
    }
    catch (error) {
        console.log(error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getDashboardStats = getDashboardStats;
//# sourceMappingURL=admin.js.map