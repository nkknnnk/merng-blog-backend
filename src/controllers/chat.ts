import {
  ALERT,
  NEW_ATTACHMENTS,
  NEW_MESSAGE,
  NEW_MESSAGE_ALERT,
  REFETCH_CHATS,
} from "../constants/events";
import {
  deleteFilesFromCloudinary,
  emitEvent,
  uploadFilesToCloudinary,
} from "../utils/features";
import { Chat } from "../models/chat";
import { getOtherMember } from "../lib/helper";
import User from "../models/User";
import { Message } from "../models/message";
import { FlattenMaps } from "mongoose";

const newGroupChat = async (
  req: { body?: any; userId?: any; app?: { get: (arg0: string) => any } },
  res: {
    status: (arg0: number) => {
      (): any;
      new (): any;
      send: { (arg0: { success: boolean; message: string }): any; new (): any };
      json: {
        (arg0: { success: boolean; message: string; data: any }): any;
        new (): any;
      };
    };
  },
  next: (arg0: unknown) => void
) => {
  const { name, members } = req.body;
  console.log(req.body);
  try {
    if (members.length < 2)
      return res.status(403).send({
        success: false,
        message: "A group chat must have at least three members",
      });
    const allMembers = [...members, req.userId];
    const chatGroup = await Chat.create({
      name,
      groupChat: true,
      creator: req.userId,
      members: allMembers,
    });
    // @ts-ignore
    emitEvent(req, ALERT, allMembers, `Welcome to ${name} group!`);
    // @ts-ignore
    emitEvent(req, REFETCH_CHATS, members);
    return res.status(201).json({
      success: true,
      message: "Group created!",
      data: chatGroup,
    });
  } catch (error: any) {
    next(error);
  }
};
const getMyChats = async (
  req: any,
  res: any,
  next: (arg0: unknown) => void
) => {
  try {
    const chats = await Chat.find({ members: req.userId }).populate(
      "members",
      "name username avatar"
    );
    console.log(chats, req.userId);
    const transformedChats = chats.map((chat) => {
      const otherMember = getOtherMember(chat.members, req.userId);
      return {
        _id: chat._id,
        groupChat: chat.groupChat,
        avatar: chat.groupChat
          ? chat?.members
              .slice(0, 3)
              .map((member: { avatar: { url: any } }) => member.avatar.url)
          : [otherMember.avatar.url],
        name: chat.groupChat ? chat.name : otherMember.name,
        members: chat.members.reduce((prev: any[], curr: { _id: any }) => {
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
  } catch (error: any) {
    next(error);
  }
};

const getMyGroups = async (
  req: { userId: any },
  res: {
    status: (arg0: number) => {
      (): any;
      new (): any;
      json: {
        (arg0: {
          success: boolean;
          groups?: { _id: any; groupChat: any; name: any; avatar: any }[];
          message?: any;
        }): any;
        new (): any;
      };
    };
  },
  next: any
) => {
  try {
    const chats = await Chat.find({
      members: req.userId,
      groupChat: true,
      creator: req.userId,
    }).populate("members", "name avatar");

    const groups = chats.map(({ members, _id, groupChat, name }) => ({
      _id,
      groupChat,
      name,
      avatar: members.slice(0, 3).map(({ avatar }: any) => avatar.url),
    }));
    return res.status(200).json({ success: true, groups });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
const addMemberToGroup = async (
  req: { body?: any; userId?: any; app?: { get: (arg0: string) => any } },
  res: {
    status: (arg0: number) => {
      (): any;
      new (): any;
      json: { (arg0: { success: boolean; message: any }): any; new (): any };
    };
  },
  next: any
) => {
  const { chatId, members } = req.body;
  try {
    const chat = await Chat.findById(chatId);
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

    const allNewMembersPromise = members.map((i: any) => User.findById(i));
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
    emitEvent(
      //@ts-ignore
      req,
      ALERT,
      chat.members,
      `${allUsersName} has been added in the group!`
    );
    //@ts-ignore
    emitEvent(req, REFETCH_CHATS, chat.members);
    return res
      .status(200)
      .json({ success: true, message: "Members added successfully" });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
const removeMemberFromGroup = async (
  req: { body?: any; userId?: any; app?: { get: (arg0: string) => any } },
  res: {
    status: (arg0: number) => {
      (): any;
      new (): any;
      json: {
        (arg0: { success: boolean; message: any; data?: null }): any;
        new (): any;
      };
    };
  }
) => {
  try {
    let { userId, chatId } = req.body;
    const [chat, userThatWillBeRemoved] = await Promise.all([
      Chat.findById(chatId),
      User.findById(userId, "name"),
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

    chat.members = chat.members.filter(
      (member: { toString: () => any }) =>
        member.toString() != userId.toString()
    );

    await chat.save();

    emitEvent(
      //@ts-ignore
      req,
      ALERT,
      chat.members,
      //@ts-ignore
      `${userThatWillBeRemoved.name} has been removed from the group`
    );
    //@ts-ignore
    emitEvent(req, REFETCH_CHATS, chat.members);

    return res.status(201).json({
      success: true,
      data: null,
      message: "Member removed successfully!",
    });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const leaveGroup = async (
  req: { params?: any; userId?: any; app?: { get: (arg0: string) => any } },
  res: {
    status: (arg0: number) => {
      (): any;
      new (): any;
      json: {
        (arg0: { success: boolean; message: any; data?: null }): any;
        new (): any;
      };
    };
  }
) => {
  try {
    const chatId = req.params.id;
    const chat = await Chat.findById(chatId);
    if (!chat)
      return res
        .status(404)
        .json({ success: false, message: "Chat not found!" });
    if (!chat.groupChat)
      return res
        .status(400)
        .json({ success: false, message: "This is Not a Group Chat!" });

    const remainingMembers = chat.members.filter(
      (member: { toString: () => any }) =>
        member.toString() !== req.userId.toString()
    );
    if (chat.creator.toString() === req.userId.toString()) {
      const randomElement = Math.floor(
        Math.random() * remainingMembers.length + 1
      );
      const newCreator = remainingMembers[randomElement];
      chat.creator = newCreator;
    }
    chat.members = remainingMembers;
    await chat.save();
    //@ts-ignore
    emitEvent(req, ALERT, chat.members, `You have been removed`);
    //@ts-ignore
    emitEvent(req, REFETCH_CHATS, chat.members);

    return res.status(201).json({
      success: true,
      data: null,
      message: "You have leaved!",
    });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Send Attachments

const sendAttachments = async (
  req: {
    body?: any;
    userId?: any;
    files?: any;
    app?: { get: (arg0: string) => any };
  },
  res: {
    status: (arg0: number) => {
      (): any;
      new (): any;
      json: { (arg0: { success: boolean; message: any }): any; new (): any };
    };
  }
) => {
  try {
    const { chatId } = req.body;
    const [chat, user] = await Promise.all([
      Chat.findById(chatId),
      User.findById(req.userId, "name"),
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
    const attachments = await uploadFilesToCloudinary(files);

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
    const message = await Message.create(messageForDB);

    //@ts-ignore
    emitEvent(req, NEW_MESSAGE, chat.members, {
      message: messageForRealTime,
      chatId,
    });
    //@ts-ignore
    emitEvent(req, NEW_MESSAGE_ALERT, chat.members, {
      chatId,
    });

    return res.status(201).json({
      success: true,
      message: message,
    });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Chat Details, rename, delete
const getChatDetails = async (
  req: { query: { populate: string }; params: { id: any } },
  res: {
    status: (arg0: number) => {
      (): any;
      new (): any;
      json: {
        (arg0: {
          success?: boolean;
          data?:
            | (FlattenMaps<any> & Required<{ _id: unknown }>)[]
            | (FlattenMaps<any> & Required<{ _id: unknown }>);
          chat?: any;
          err?: any;
        }): any;
        new (): any;
      };
    };
  }
) => {
  try {
    if (req.query.populate === "true") {
      const chat = await Chat.findById(req.params.id)
        .populate("members", "name avatar")
        .lean();
      if (!chat) throw new Error("Chat not found");
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
    } else {
      const chat = await Chat.findById(req.params.id);
      if (!chat) throw new Error("No such chat exists");
      return res.status(200).json({
        success: true,
        chat,
      });
    }
  } catch (e: any) {
    return res.status(400).json({
      err: e.message,
    });
  }
};

const renameGroup = async (
  req: {
    params?: any;
    body?: any;
    userId?: any;
    app?: { get: (arg0: string) => any };
  },
  res: {
    status: (arg0: number) => {
      (): any;
      new (): any;
      json: {
        (arg0: { success?: boolean; message?: string; err?: any }): any;
        new (): any;
      };
      send: { (arg0: string): any; new (): any };
    };
  }
) => {
  try {
    const chatId = req.params.id;
    const { name } = req.body;
    let chat = await Chat.findById(chatId);
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
    emitEvent(req, REFETCH_CHATS, chat.members);
    return res
      .status(200)
      .json({ success: true, message: "Group renamed Successfully" });
  } catch (e: any) {
    return res.status(500).json({
      err: e.message,
    });
  }
};

const deleteChat = async (
  req: { params?: any; userId?: any; app?: { get: (arg0: string) => any } },
  res: {
    status: (arg0: number) => {
      (): any;
      new (): any;
      json: {
        (arg0: { success?: boolean; message?: string; err?: any }): void;
        new (): any;
      };
    };
  }
) => {
  try {
    const chatId = req.params.id;
    const chat = await Chat.findById(chatId);
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
    const messagesWithAttachments = await Message.find({
      chat: chatId,
      attachments: { $exists: true, $ne: [] },
    });

    const public_ids: any[] = [];
    messagesWithAttachments.forEach((message) => {
      message.attachments.forEach((attachment: { public_id: any }) => {
        public_ids.push(attachment.public_id);
      });
    });
    await Promise.all([
      //  Removing all the messages with attachment from cloudinary
      deleteFilesFromCloudinary(public_ids),
      chat.deleteOne(),
      Message.deleteMany({ chat: chatId }),
    ]);
    //@ts-ignore
    emitEvent(req, REFETCH_CHATS, chat.members);
    res.status(200).json({
      success: true,
      message: `Deleted chat ${chatId}`,
    });
  } catch (e: any) {
    return res.status(500).json({
      err: e.message,
    });
  }
};

const getMessage = async (
  req: { params: { id: any }; query: { page?: 1 | undefined } },
  res: {
    status: (arg0: number) => {
      (): any;
      new (): any;
      json: {
        (arg0: {
          success?: boolean;
          messages?: (FlattenMaps<any> & Required<{ _id: unknown }>)[];
          totalPages?: number;
          err?: any;
        }): any;
        new (): any;
      };
    };
  }
) => {
  try {
    const chatId = req.params.id;
    const { page = 1 } = req.query;
    const limit = 20;
    const skip = (page - 1) * limit;
    const [messages, totalMessagesCount] = await Promise.all([
      Message.find({ chat: chatId })
        .sort("createdAt")
        .skip(skip)
        .limit(limit)
        .populate("sender", "name avatar")
        .lean(),
      Message.countDocuments({ chat: chatId }),
    ]);
    const totalPages = Math.ceil(totalMessagesCount / limit);
    return res.status(200).json({
      success: true,
      messages: messages.reverse(),
      totalPages,
    });
  } catch (e: any) {
    return res.status(500).json({
      err: e.message,
    });
  }
};

export {
  newGroupChat,
  getMyChats,
  getMyGroups,
  addMemberToGroup,
  removeMemberFromGroup,
  leaveGroup,
  sendAttachments,
  getChatDetails,
  renameGroup,
  deleteChat,
  getMessage,
};
