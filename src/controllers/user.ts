import { compare } from "bcrypt";
import User from "../models/User";
import { Request } from "../models/request";
import {
  cookieOption,
  emitEvent,
  sendToken,
  uploadFilesToCloudinary,
} from "../utils/features";
import { NEW_REQUEST, REFETCH_CHATS } from "../constants/events";
import { Chat } from "../models/chat";
import { getOtherMember } from "../lib/helper";
import { Document } from "mongoose";
import { v4 as uuid } from "uuid";


const newUser = async (
  req: {
    body: { name: any;email: string; username: any; password: any; bio: any };
    file: any;
  },
  res: { status: any }
) => {
  const { name, username, password,email, bio } = req.body;
  console.log(req.body)
  try {
    const file = req.file;

    // const result = await uploadFilesToCloudinary([file]);
    const avatar = {
      public_id: "c3701b4a-6546-44c7-a35b-360dd50e13f7",
      url: "https://res.cloudinary.com/du089cjvu/image/upload/v1712464485/c3701b4a-6546-44c7-a35b-360dd50e13f7.png",
    };
    const user = await User.create({
      name,
      email: uuid(),
      username,
      password,
      avatar,
    });
    return sendToken(res, user, 201, "User created successfully");
  } catch (error: any) {
    console.log(error.message);
    return res.status(500).json({ message: error.message });
  }
};
// Log in a registered user and generate token
const login = async (
  req: { body: { username: any; password: any } },
  res: { status: any }
) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username }).select("+password");
    console.log(user);
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const isMatch = await compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    sendToken(res, user, 200, `Welcome back ${user.username}`);
  } catch (error: any) {
    console.log(error.message);
    return res.status(400).json({ message: "Invalid credentials" });
  }
};

const getMyProfile = async (
  req: { userId: any },
  res: {
    status: (arg0: number) => {
      (): any;
      new (): any;
      json: {
        (arg0: {
          success: boolean;
          data:
            | (Document<unknown, {}, { [x: string]: any }> & {
                [x: string]: any;
              } & Required<{ _id: unknown }>)
            | null;
        }): any;
        new (): any;
      };
    };
  }
) => {
  try {
    const user = await User.findById(req.userId);
    return res.status(200).json({ success: true, data: user });
  } catch (error: any) {
    // @ts-ignore
    next(error);
  }
};
const logout = async (
  req: any,
  res: {
    status: (arg0: number) => {
      (): any;
      new (): any;
      cookie: {
        (
          arg0: string,
          arg1: string,
          arg2: {
            maxAge: number;
            sameSite: string;
            httpOnly: boolean;
            secure: boolean;
          }
        ): {
          (): any;
          new (): any;
          json: {
            (arg0: { success: boolean; message: string }): any;
            new (): any;
          };
        };
        new (): any;
      };
      json: { (arg0: { message: any }): any; new (): any };
    };
  }
) => {
  try {
    return res
      .status(200)
      .cookie("chat-cookie-token", "", { ...cookieOption, maxAge: 0 })
      .json({ success: true, message: "Logged out successfully!" });
  } catch (error: any) {
    console.log(error.message);
    return res.status(500).json({ message: error.message });
  }
};
// Search User
const searchUser = async (
  req: { query: { name: any }; userId: any },
  res: {
    status: (arg0: number) => {
      (): any;
      new (): any;
      json: {
        (arg0: {
          success: boolean;
          // count: users.length,
          data: { name: any; _id: any; avatar: any }[];
        }): any;
        new (): any;
      };
    };
  }
) => {
  const { name } = req.query;
  const myChats = await Chat.find({ groupChat: false, members: req.userId });

  // All Users from my chats means friends or people i have chatted with
  const allUsersFromMyChats = myChats.flatMap((chat) => chat.members);

  //sf
  const allUsersExceptMeAndFriends = await User.find({
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

const sendRequest = async (
  req: {
    body?: any;
    user?: any;
    userId?: any;
    app?: { get: (arg0: string) => any };
  },
  res: {
    status: (arg0: number) => {
      (): any;
      new (): any;
      json: { (arg0: { success?: boolean; message: any }): any; new (): any };
    };
  }
) => {
  try {
    const { userId } = req.body;
    const request = await Request.findOne({
      $or: [
        { sender: req.user, receiver: userId },
        { sender: userId, receiver: req.user },
      ],
    });
    if (request)
      return res
        .status(400)
        .json({ success: false, message: "Request already sent" });

    await Request.create({
      sender: req.userId,
      receiver: userId,
    });
    // @ts-ignore
    emitEvent(req, NEW_REQUEST, [userId]);
    return res
      .status(200)
      .json({ success: true, message: "Friend Request sent" });
  } catch (error: any) {
    console.log(error.message);
    return res.status(500).json({ message: error.message });
  }
};
const acceptRequest = async (
  req: { body?: any; userId?: any; app?: { get: (arg0: string) => any } },
  res: {
    status: (arg0: number) => {
      (): any;
      new (): any;
      json: {
        (arg0: { success?: boolean; message: any; senderId?: any }): any;
        new (): any;
      };
    };
  }
) => {
  try {
    const { requestId, accept } = req.body;
    const request = await Request.findById(requestId)
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
      Chat.create({
        members,
        name: `${request.sender.name} and ${request.receiver.name}`,
      }),
      request.deleteOne(),
    ]);
    // @ts-ignore
    emitEvent(req, REFETCH_CHATS, members);
    return res.status(200).json({
      success: true,
      message: "Friend Request Accepted",
      senderId: request.sender._id,
    });
  } catch (error: any) {
    console.log(error.message);
    return res.status(500).json({ message: error.message });
  }
};

const getAllNotifications = async (
  req: { userId: any },
  res: {
    status: (arg0: number) => {
      (): any;
      new (): any;
      json: {
        (arg0: {
          success: boolean;
          message: any;
          allRequests?: {
            _id: any;
            sender: { _id: any; name: any; avatar: any };
          }[];
        }): any;
        new (): any;
      };
    };
  }
) => {
  try {
    const requsets = await Request.find({ receiver: req.userId }).populate(
      "sender",
      "name avatar"
    );
    const allRequests = requsets.map(({ _id, sender }) => ({
      _id,
      sender: { _id: sender._id, name: sender.name, avatar: sender.avatar.url },
    }));
    return res.status(200).json({ success: true, message: "", allRequests });
  } catch (error: any) {
    console.log(error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};
const getMyFriends = async (
  req: { query: { chatId: any }; userId: any },
  res: {
    status: (arg0: number) => {
      (): any;
      new (): any;
      json: {
        (arg0: {
          success: boolean;
          availableFriends?: { _id: any; name: any; avatar: any }[];
          message?: any;
          friends?: { _id: any; name: any; avatar: any }[];
        }): any;
        new (): any;
      };
    };
  }
) => {
  try {
    const chatId = req.query.chatId;
    const chats = await Chat.find({
      members: req.userId,
      groupChat: false,
    }).populate("members", "name, avatar");
    const friends = chats.map(({ members }) => {
      const otherUser = getOtherMember(members, req.userId);
      return {
        _id: otherUser._id,
        name: otherUser.name,
        avatar: otherUser.avatar.url,
      };
    });
    if (chatId) {
      const chat = await Chat.findById(chatId);
      const availableFriends = friends.filter(
        (friend) => !chat.members.includes(friend._id)
      );
      return res.status(200).json({ success: true, availableFriends });
    }
    return res.status(200).json({ success: true, message: "", friends });
  } catch (error: any) {
    console.log(error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export {
  login,
  newUser,
  getMyProfile,
  logout,
  searchUser,
  sendRequest,
  acceptRequest,
  getAllNotifications,
  getMyFriends,
};
