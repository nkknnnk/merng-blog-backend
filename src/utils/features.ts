import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { v4 as uuid } from "uuid";
import { getBase64, getSockets } from "../lib/helper";
import { v2 as cloudinary } from "cloudinary";

const cookieOption = {
  maxAge: 24 * 60 * 60 * 1000,
  sameSite: "none",
  httpOnly: true,
  secure: true,
};

const sendToken = (
  res: {
    status: (arg0: number) => {
      (): any;
      new (): any;
      cookie: {
        (
          arg0: string,
          arg1: never,
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
            (arg0: {
              success: boolean;
              token: never;
              message: any;
              user: any;
            }): any;
            new (): any;
          };
        };
        new (): any;
      };
      send: { (arg0: { error: string; message: any }): any; new (): any };
    };
  },
  user: mongoose.Document<unknown, {}, { [x: string]: any }> & {
    [x: string]: any;
  } & Required<{ _id: unknown }>,
  code: number,
  message: string
) => {
  // @ts-ignore
  const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
  console.log(token);
  try {
    return res
      .status(code)
      .cookie("chat-cookie-token", token, cookieOption)
      .json({ success: true, token, message, user });
  } catch (error:any) {
    console.log(error.message);
    return res
      .status(500)
      .send({ error: "Error sending token", message: error.message });
  }
};

const emitEvent = (
  req: { app: { get: (arg0: string) => any } },
  event: string,
  users: any[] | undefined,
  data: any
) => {
  let io = req.app.get("io");
  // @ts-ignore
  const userSocket = getSockets(users);
  io.to(userSocket).emit(event, data);
  console.log("Emmiting event: ", event, users, data);
};

const uploadFilesToCloudinary = async (files = []) => {
  try {
    const uploadPromises = files.map((file) => {
      return new Promise((resolve, reject) => {
        cloudinary.uploader.upload(
          getBase64(file),
          {
            resource_type: "auto",
            public_id: uuid(),
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
      });
    });

    const results = await Promise.all(uploadPromises);
    const formattedResults = results.map((result) => ({
        // @ts-ignore
        public_id: result?.public_id,
        // @ts-ignore
      url: result?.secure_url,
    }));
    return formattedResults;
  } catch (error:any) {
    console.log(error.message);
    return [];
  }
};

const deleteFilesFromCloudinary = async (publicId: any) => {};

export {
  sendToken,
  cookieOption,
  emitEvent,
  uploadFilesToCloudinary,
  deleteFilesFromCloudinary,
};
