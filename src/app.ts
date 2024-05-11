import express from "express";
// var bodyParser = require("body-parser");
import { config } from "dotenv";
import { graphqlHTTP } from "express-graphql";
import schema from "./handlers/handlers";
import cors from "cors";
import { connectToDatabase } from "./utils/connection";
import { createServer } from "http";
import adminRoutes from "./routes/admin";
import chatRoutes from "./routes/chat";
import userRoutes from "./routes/user";
import { Server } from "socket.io";
import { v2 as cloudinary } from "cloudinary";
import { NEW_MESSAGE, NEW_MESSAGE_ALERT } from "./constants/events";
import { v4 as uuid } from "uuid";
import { getSockets } from "./lib/helper";
import { Message } from "./models/message";
import User from "./models/User";
import jwt from "jsonwebtoken";


const videoDownloader = require("./routes/videoDownloader");

const origin = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://192.168.0.184:3000",
  "http://192.168.0.195:3000",
  "https://devnitish.com",
]
// Dotenv config
config();

// active users
const userSocketIDs = new Map();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin, credentials: true },
});
app.set("io", io);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin,
    credentials: true,
  })
);
app.get("/", (req: any, res: any) => {
  console.log(req.body.username);
  res.json("Hello World!");
});
app.use("/api/v1/graphql", graphqlHTTP({ schema, graphiql: true }));
app.use("/mediaapi", videoDownloader);

// Set up the server to use the routes defined in /src/routes
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/chat", chatRoutes);


io.use(async (socket:any, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Authentication error"));
    }
    const decodedData = jwt.verify(token, process.env.JWT_SECRET!);
    // @ts-ignore
    if (decodedData._id) {
      // @ts-ignore
      const user = await User.findById(decodedData._id);
      if (!user) {
        return next(new Error("Authentication error"));
      }
      socket.user = user;
      // console.log(socket.user)
      return next();
    }
    return next(new Error("Authentication error"));
  } catch (error:any) {
    console.log(error.message)
  }
});

io.on("connection", (socket: any) => {
  const user = socket.user;

  userSocketIDs.set(user?._id.toString(), socket.id);
  // console.log("a user connected", userSocketIDs);
  // console.log(user)
  socket.on("TEST", () => {
    console.log("TEST IS WORKING...");
    io.emit("TEST", "test is working...");
  });
  socket.emit("RESPONSE", "WORKS!");
  socket.on(NEW_MESSAGE, async ({ chatId, members, message }: any) => {
    console.log("message got", { chatId, members, message });
    const messageForRealTime = {
      content: message,
      _id: uuid(),
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
    const membersSocket = getSockets(members);
    io.to(membersSocket).emit(NEW_MESSAGE, {
      chatId,
      message: messageForRealTime,
    });
    io.to(membersSocket).emit(NEW_MESSAGE_ALERT, { chatId });
    await Message.create(messageForDB);
  });
  socket.on("disconnect", () => {
    console.log("user disconnected");
    userSocketIDs.delete(user?._id?.toString());
  });
});

connectToDatabase()
  .then(() => {
    server.listen(process.env.PORT, () =>
      console.log(`Server Open On Port ${process.env.PORT}`)
    );
  })
  .catch((err) => console.log(err));

export { userSocketIDs };
