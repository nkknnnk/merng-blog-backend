"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userSocketIDs = void 0;
const express_1 = __importDefault(require("express"));
// var bodyParser = require("body-parser");
const dotenv_1 = require("dotenv");
const express_graphql_1 = require("express-graphql");
const handlers_1 = __importDefault(require("./handlers/handlers"));
const cors_1 = __importDefault(require("cors"));
const connection_1 = require("./utils/connection");
const http_1 = require("http");
const admin_1 = __importDefault(require("./routes/admin"));
const chat_1 = __importDefault(require("./routes/chat"));
const user_1 = __importDefault(require("./routes/user"));
const socket_io_1 = require("socket.io");
const cloudinary_1 = require("cloudinary");
const events_1 = require("./constants/events");
const uuid_1 = require("uuid");
const helper_1 = require("./lib/helper");
const message_1 = require("./models/message");
const User_1 = __importDefault(require("./models/User"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const videoDownloader = require("./routes/videoDownloader");
// Dotenv config
(0, dotenv_1.config)();
// active users
const userSocketIDs = new Map();
exports.userSocketIDs = userSocketIDs;
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, {
    cors: { origin: ["http://localhost:5173", "http://localhost:3000"], credentials: true },
});
app.set("io", io);
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
// Middleware
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)({
    origin: [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://192.168.0.198:3000",
        "https://devnitish.com",
    ],
    credentials: true,
}));
app.get("/", (req, res) => {
    console.log(req.body.username);
    res.json("Hello World!");
});
app.use("/api/v1/graphql", (0, express_graphql_1.graphqlHTTP)({ schema: handlers_1.default, graphiql: true }));
app.use("/mediaapi", videoDownloader);
// Set up the server to use the routes defined in /src/routes
app.use("/api/v1/admin", admin_1.default);
app.use("/api/v1/user", user_1.default);
app.use("/api/v1/chat", chat_1.default);
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error("Authentication error"));
        }
        const decodedData = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        // @ts-ignore
        if (decodedData._id) {
            // @ts-ignore
            const user = await User_1.default.findById(decodedData._id);
            if (!user) {
                return next(new Error("Authentication error"));
            }
            socket.user = user;
            // console.log(socket.user)
            return next();
        }
        return next(new Error("Authentication error"));
    }
    catch (error) {
        console.log(error.message);
    }
});
io.on("connection", (socket) => {
    const user = socket.user;
    userSocketIDs.set(user?._id.toString(), socket.id);
    // console.log("a user connected", userSocketIDs);
    // console.log(user)
    socket.on("TEST", () => {
        console.log("TEST IS WORKING...");
        io.emit("TEST", "test is working...");
    });
    socket.emit("RESPONSE", "WORKS!");
    socket.on(events_1.NEW_MESSAGE, async ({ chatId, members, message }) => {
        console.log("message got", { chatId, members, message });
        const messageForRealTime = {
            content: message,
            _id: (0, uuid_1.v4)(),
            sender: {
                _id: user?._id,
                name: user?.name,
            },
            chat: chatId,
            createdAt: new Date().toISOString(),
        };
        const messageForDB = {
            content: message,
            sender: user?._id,
            attachments: {
                public_id: "{ type: String, required: true }",
                url: "{ type: String, required: true }",
            },
            chat: chatId,
        };
        const membersSocket = (0, helper_1.getSockets)(members);
        io.to(membersSocket).emit(events_1.NEW_MESSAGE, {
            chatId,
            message: messageForRealTime,
        });
        io.to(membersSocket).emit(events_1.NEW_MESSAGE_ALERT, { chatId });
        await message_1.Message.create(messageForDB);
    });
    socket.on("disconnect", () => {
        console.log("user disconnected");
        userSocketIDs.delete(user?._id?.toString());
    });
});
(0, connection_1.connectToDatabase)()
    .then(() => {
    server.listen(process.env.PORT, () => console.log(`Server Open On Port ${process.env.PORT}`));
})
    .catch((err) => console.log(err));
//# sourceMappingURL=app.js.map