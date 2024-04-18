import multer from "multer";

export const multerUpload = multer({
  limits: {
    fileSize: 1024 * 1024 * 5, // Maximum file size is 5MB
  },
});

export const attachmentMulter = multerUpload.array("files", 5)
