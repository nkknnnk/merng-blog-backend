"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
// var bodyParser = require("body-parser");
const dotenv_1 = require("dotenv");
const express_graphql_1 = require("express-graphql");
const handlers_1 = __importDefault(require("./handlers/handlers"));
const cors_1 = __importDefault(require("cors"));
const socket_io_1 = require("socket.io");
const sessionStore_1 = __importDefault(require("./sessionStore"));
const MessageStore_1 = __importDefault(require("./MessageStore"));
const crypto = require("crypto");
const { instrument } = require("@socket.io/admin-ui");
const videoDownloader = require("./routes/videoDownloader");
// Dotenv config
(0, dotenv_1.config)();
const app = (0, express_1.default)();
// Middleware
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)());
app.get("/", (req, res) => {
    console.log(req.body.username);
    res.json("Hello World!");
});
app.use("/graphql", (0, express_graphql_1.graphqlHTTP)({ schema: handlers_1.default, graphiql: true }));
app.use("/mediaapi", videoDownloader);
// Socket.io ---------------------------------------------------------------------------
const http_1 = require("http");
const httpServer = (0, http_1.createServer)();
const messageStore = new MessageStore_1.default();
const store = new sessionStore_1.default();
// @ts-ignore
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: [
            "https://admin.socket.io",
            "http://localhost:3000",
            "https://admin.socket.io",
        ],
        credentials: true,
    },
});
instrument(io, {
    auth: {
        type: "basic",
        username: "admin",
        password: "$2b$10$heqvAkYMez.Va6Et2uXInOnkCT6/uQj1brkrbyG3LpopDklcq7ZOS", // "changeit" encrypted with bcrypt
    },
    mode: "development",
});
io.use((socket, next) => {
    const sessionID = socket.handshake.auth.sessionID;
    if (sessionID) {
        const session = store.findSession(sessionID);
        socket.sessionID = sessionID;
        socket.userID = session.userID;
        socket.username = session.username;
        return next();
    }
    const username = socket.handshake.auth.username;
    if (!username) {
        return next(new Error("Invalid username"));
    }
    socket.username = username;
    socket.userID = crypto.randomBytes(8).toString("hex");
    socket.sessionID = crypto.randomBytes(8).toString("hex");
    next();
});
io.on("connection", (socket) => {
    store.saveSession(socket.sessionID, {
        userID: socket.userID,
        username: socket.username,
        connected: true,
    });
    const users = [];
    const messages = messageStore.findMessagesForUser(socket.userID);
    const messgaeInfo = new Map();
    if (messages) {
        messages.forEach((message) => {
            const otherUser = message.from === socket.userID ? message.to : message.from;
            if (messgaeInfo.has(otherUser)) {
                messgaeInfo
                    .get(otherUser)
                    .push({ ...message, fromSelf: socket.userID === message.from });
            }
            else {
                messgaeInfo.set(otherUser, [
                    { ...message, fromSelf: socket.userID === message.from },
                ]);
            }
        });
    }
    store.findAllSessions().forEach((session) => {
        users.push({
            userID: session.userID,
            username: session.username,
            connected: session.connected,
            messages: messgaeInfo.get(session.userID) || [],
        });
    });
    socket.join(socket.userID);
    // Emitting the session from server to client
    socket.emit("session", {
        sessionID: socket.sessionID,
        userID: socket.userID,
    });
    socket.emit("users", users);
    // notify existing users
    socket.broadcast.emit("user connected", {
        userID: socket.userID,
        username: socket.username,
        connected: true,
    });
    socket.on("private message", ({ content, to }) => {
        socket.to(to).to(socket.userID).emit("private message", {
            content,
            from: socket.userID,
            to,
        });
        messageStore.saveMessage({
            content,
            from: socket.userID,
            to,
        });
    });
    socket.on("disconnect", async () => {
        const matchingSockets = await io.in(socket.userID).allSockets();
        const isDisconnected = matchingSockets.size === 0;
        if (isDisconnected) {
            socket.broadcast.emit("user disconnected", socket.userID);
            store.saveSession(socket.sessionID, {
                userID: socket.userID,
                username: socket.username,
                connected: false,
            });
        }
    });
});
httpServer.listen(process.env.SOCKET_PORT, () => {
    console.log("HTTPServer Socket Server Listing on Port: ", process.env.SOCKET_PORT);
});
module.exports = app;
//# sourceMappingURL=app.js.map