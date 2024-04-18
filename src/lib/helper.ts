import { userSocketIDs } from "../app";

export const getOtherMember = (members: any[], userId: any) => {
  return members.find((member: { _id: any; }) => member._id !== userId);
};
export const getSockets = (users = []) => {
  const sockets = users.map((user) => userSocketIDs.get(user));
  console.log("sockets: ", sockets, users)
  return sockets;
};

export const getBase64 = (file: any) =>
  `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
