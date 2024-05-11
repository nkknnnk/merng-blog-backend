"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyFriends = exports.getAllNotifications = exports.acceptRequest = exports.sendRequest = exports.searchUser = exports.logout = exports.getMyProfile = exports.getAllUsers = exports.newUser = exports.login = void 0;
const bcrypt_1 = require("bcrypt");
const User_1 = __importDefault(require("../models/User"));
const request_1 = require("../models/request");
const features_1 = require("../utils/features");
const events_1 = require("../constants/events");
const chat_1 = require("../models/chat");
const helper_1 = require("../lib/helper");
const newUser = async (req, res) => {
    const { name, username, password, email, bio } = req.body;
    console.log(req.body);
    try {
        const file = req.file;
        // const result = await uploadFilesToCloudinary([file]);
        const avatar = {
            public_id: "c3701b4a-6546-44c7-a35b-360dd50e13f7",
            url: "https://res.cloudinary.com/du089cjvu/image/upload/v1712464485/c3701b4a-6546-44c7-a35b-360dd50e13f7.png",
        };
        const user = await User_1.default.create({
            name,
            email,
            username: email,
            password,
            avatar,
        });
        return (0, features_1.sendToken)(res, user, 201, "User created successfully");
    }
    catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: error.message });
    }
};
exports.newUser = newUser;
const getAllUsers = async (req, res) => {
    try {
        const users = await User_1.default.find().select(["-password", "-blogs", "-comments", "-__v", "-email", "-username"]);
        return res.status(200).json({
            success: true,
            users: users.filter(user => user?._id?.toString() !== req.userId),
        });
    }
    catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: error.message });
    }
};
exports.getAllUsers = getAllUsers;
// Log in a registered user and generate token
const login = async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User_1.default.findOne({ username }).select("+password");
        console.log(user);
        if (!user) {
            return res.status(400).json({ message: "User not Found" });
        }
        const isMatch = await (0, bcrypt_1.compare)(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        (0, features_1.sendToken)(res, user, 200, `Welcome back ${user.username}`);
    }
    catch (error) {
        console.log(error.message);
        return res
            .status(500)
            .json({ message: "Something went wrong! Please try again" });
    }
};
exports.login = login;
const getMyProfile = async (req, res) => {
    try {
        const user = await User_1.default.findById(req.userId);
        return res.status(200).json({ success: true, data: user });
    }
    catch (error) {
        console.log(error.message);
        // @ts-ignore
        return res.status(500).json({ message: error.message });
    }
};
exports.getMyProfile = getMyProfile;
const logout = async (req, res) => {
    try {
        return res
            .status(200)
            .cookie("chat-cookie-token", "", { ...features_1.cookieOption, maxAge: 0 })
            .json({ success: true, message: "Logged out successfully!" });
    }
    catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: error.message });
    }
};
exports.logout = logout;
// Search User
const searchUser = async (req, res) => {
    const { name } = req.query;
    const myChats = await chat_1.Chat.find({ groupChat: false, members: req.userId });
    // All Users from my chats means friends or people i have chatted with
    const allUsersFromMyChats = myChats.flatMap((chat) => chat.members);
    //sf
    const allUsersExceptMeAndFriends = await User_1.default.find({
        _id: { $nin: allUsersFromMyChats },
        name: { $regex: name, $options: "i" },
    });
    // console.log(allUsersExceptMeAndFriends)
    const users = allUsersExceptMeAndFriends.map((i) => {
        // @ts-ignore
        return { name: i.name, _id: i._id.toString(), avatar: i.avatar.url };
    });
    console.log(users);
    // Get users from DB
    // const users = await User.find({ $text: { $search: keyword } })
    //   .select("-__v -password")
    //   .sort([["createdAt", "descending"]]);
    // Return response
    return res.status(200).json({
        success: true,
        // count: users.length,
        data: users,
    });
};
exports.searchUser = searchUser;
const sendRequest = async (req, res) => {
    try {
        const { userId } = req.body;
        const request = await request_1.Request.findOne({
            $or: [
                { sender: req.user, receiver: userId },
                { sender: userId, receiver: req.user },
            ],
        });
        if (request)
            return res
                .status(400)
                .json({ success: false, message: "Request already sent" });
        await request_1.Request.create({
            sender: req.userId,
            receiver: userId,
        });
        // @ts-ignore
        (0, features_1.emitEvent)(req, events_1.NEW_REQUEST, [userId]);
        return res
            .status(200)
            .json({ success: true, message: "Friend Request sent" });
    }
    catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: error.message });
    }
};
exports.sendRequest = sendRequest;
const acceptRequest = async (req, res) => {
    try {
        const { requestId, accept } = req.body;
        const request = await request_1.Request.findById(requestId)
            .populate("sender", "name")
            .populate("receiver", "name");
        if (!request)
            return res
                .status(404)
                .json({ success: false, message: "Request Not Found" });
        if (request.receiver._id.toString() !== req.userId.toString())
            return res.status(401).json({
                success: false,
                message: "You are not authorized to accept this request",
            });
        if (!accept) {
            await request.deleteOne();
            return res
                .status(200)
                .json({ success: true, message: "Friend Request Rejected" });
        }
        const members = [request.sender._id, request.receiver._id];
        await Promise.all([
            chat_1.Chat.create({
                members,
                name: `${request.sender.name} and ${request.receiver.name}`,
            }),
            request.deleteOne(),
        ]);
        // @ts-ignore
        (0, features_1.emitEvent)(req, events_1.REFETCH_CHATS, members);
        return res.status(200).json({
            success: true,
            message: "Friend Request Accepted",
            senderId: request.sender._id,
        });
    }
    catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: error.message });
    }
};
exports.acceptRequest = acceptRequest;
const getAllNotifications = async (req, res) => {
    try {
        const requsets = await request_1.Request.find({ receiver: req.userId }).populate("sender", "name avatar");
        const allRequests = requsets.map(({ _id, sender }) => ({
            _id,
            sender: { _id: sender._id, name: sender.name, avatar: sender.avatar.url },
        }));
        return res.status(200).json({ success: true, message: "", allRequests });
    }
    catch (error) {
        console.log(error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getAllNotifications = getAllNotifications;
const getMyFriends = async (req, res) => {
    try {
        const chatId = req.query.chatId;
        const chats = await chat_1.Chat.find({
            members: req.userId,
            groupChat: false,
        }).populate("members", "name, avatar");
        const friends = chats.map(({ members }) => {
            const otherUser = (0, helper_1.getOtherMember)(members, req.userId);
            return {
                _id: otherUser._id,
                name: otherUser.name,
                avatar: otherUser.avatar.url,
            };
        });
        if (chatId) {
            const chat = await chat_1.Chat.findById(chatId);
            const availableFriends = friends.filter((friend) => !chat.members.includes(friend._id));
            return res.status(200).json({ success: true, availableFriends });
        }
        return res.status(200).json({ success: true, message: "", friends });
    }
    catch (error) {
        console.log(error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getMyFriends = getMyFriends;
//# sourceMappingURL=user.js.map