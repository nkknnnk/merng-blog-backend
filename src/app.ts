import express from "express";
// var bodyParser = require("body-parser");
import { config } from "dotenv";
import { graphqlHTTP } from "express-graphql";
import schema from "./handlers/handlers";
import cors from "cors";
import { Server } from "socket.io";
import SessionStore from "./sessionStore";
import MessageStore from "./MessageStore";
const crypto = require("crypto");
const { instrument } = require("@socket.io/admin-ui");
const videoDownloader = require("./routes/videoDownloader");

// Dotenv config
config();

const app = express();
// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());
app.get("/", (req: any, res: any) => {
  console.log(req.body.username);
  res.json("Hello World!");
});
app.use("/graphql", graphqlHTTP({ schema, graphiql: true }));
app.use("/mediaapi", videoDownloader);


// Socket.io ---------------------------------------------------------------------------
import { createServer } from "http";
const httpServer = createServer();

const messageStore = new MessageStore();
const store = new SessionStore();
// @ts-ignore
const io = new Server(httpServer, {
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

io.use((socket: any, next) => {
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

io.on("connection", (socket: any) => {
  store.saveSession(socket.sessionID, {
    userID: socket.userID,
    username: socket.username,
    connected: true,
  });
  const users: any = [];

  const messages = messageStore.findMessagesForUser(socket.userID);
  const messgaeInfo = new Map();
  if (messages) {
    messages.forEach((message: any) => {
      const otherUser =
        message.from === socket.userID ? message.to : message.from;
      if (messgaeInfo.has(otherUser)) {
        messgaeInfo
          .get(otherUser)
          .push({ ...message, fromSelf: socket.userID === message.from });
      } else {
        messgaeInfo.set(otherUser, [
          { ...message, fromSelf: socket.userID === message.from },
        ]);
      }
    });
  }
  store.findAllSessions().forEach((session: any) => {
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

  socket.on("private message", ({ content, to }: any) => {
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
// httpServer.listen(process.env.SOCKET_PORT, () => {
//   console.log("HTTPServer Socket Server Listing on Port: ", process.env.SOCKET_PORT)
// })
module.exports = app
