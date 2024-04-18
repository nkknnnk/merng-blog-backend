import { Chat } from "../models/chat";
import { Message } from "../models/message";
import User  from "../models/User";

const allUsers = async (req: any, res: { status: (arg0: number) => { (): any; new(): any; json: { (arg0: { success: boolean; users?: { name: any; username: any; avatar: any; _id: unknown; groups: number; friends: number; }[]; message?: any; }): any; new(): any; }; }; }) => {
  try {
    let users = await User.find({});
    const transformedUsers = await Promise.all(
      users.map(async ({ name, username, avatar, _id }) => {
        const [groups, friends] = await Promise.all([
          Chat.countDocuments({ groupChat: true, members: _id }),
          Chat.countDocuments({ groupChat: false, members: _id }),
        ]);
        return {
          name,
          username,
          avatar: avatar.url,
          _id,
          groups,
          friends,
        };
      })
    );
    return res.status(200).json({ success: true, users: transformedUsers });
  } catch (error: any) {
    console.log(error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};
const allChats = async (req: any, res: { status: (arg0: number) => { (): any; new(): any; json: { (arg0: { success: boolean; transformedChats?: { _id: any; groupChat: any; name: any; avatar: any; members: any; creator: { name: any; avatar: any; }; totalMembers: any; totalMessages: number; }[]; message?: any; }): any; new(): any; }; }; }) => {
  try {
    const chats = await Chat.find({})
      .populate("members", "name avatar")
      .populate("creator", "name avatar");
    const transformedChats = await Promise.all(
      chats.map(async ({ members, _id, groupChat, name, creator }) => {
        const totalMessages = await Message.countDocuments({ chat: _id });
        return {
          _id,
          groupChat,
          name,
          avatar: members.slice(0, 3).map((member: { avatar: { url: any; }; }) => member.avatar.url),
          members: members.map(({ _id, name, avatar }:any) => ({
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
      })
    );

    return res.status(200).json({ success: true, transformedChats });
  } catch (error: any) {
    console.log(error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};
const allMessages = async (req: any, res: { status: (arg0: number) => { (): any; new(): any; json: { (arg0: { success: boolean; messages?: { _id: any; attachments: any; content: any; createdAt: any; chat: any; groupChat: any; sender: { _id: any; name: any; avatar: any; }; }[]; message?: any; }): any; new(): any; }; }; }) => {
  try {
    const messages = await Message.find({})
      .populate("sender", "name avatar")
      .populate("chat", "groupChat");
    const transformedMessages = messages.map(
      ({ content, attachments, _id, sender, createdAt, chat }) => ({
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
      })
    );
    return res
      .status(200)
      .json({ success: true, messages: transformedMessages });
  } catch (error:any) {
    console.log(error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};
const getDashboardStats = async (req: any, res: { status: (arg0: number) => { (): any; new(): any; json: { (arg0: { success: boolean; stats?: { groupsCount: number; usersCount: number; messagesCount: number; totalChats: number; messagesChart: any[]; }; message?: any; }): any; new(): any; }; }; }) => {
  try {
    const [groupsCount, usersCount, messagesCount, totalChatCount] =
      await Promise.all([
        Chat.countDocuments({ groupChat: true }),
        User.countDocuments(),
        Message.countDocuments(),
        Chat.countDocuments(),
      ]);
    const today = new Date();
    const last7Days = new Date();
    last7Days.setDate(today.getDate() - 7);

    const last7DayMessages = await Message.find({
      createdAt: { $gte: last7Days, $lte: today },
    }).select("createdAt");

    const messages = new Array(7).fill(0);
    const dayInMiliseconds = 1000 * 60 * 60 * 24;
    last7DayMessages.forEach((message) => {
      const indexApprox =
        (today.getTime() - message.createdAt.getTime()) / dayInMiliseconds;
      const index = Math.floor(indexApprox);
      messages[6-index]++
    });
    const stats = {
      groupsCount,
      usersCount,
      messagesCount,
      totalChats: totalChatCount,
      messagesChart: messages,
    };
    return res.status(200).json({ success: true, stats });
  } catch (error:any) {
    console.log(error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export { allUsers, allChats, allMessages, getDashboardStats };
