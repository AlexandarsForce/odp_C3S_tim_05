import multer from "multer";
import type { Request } from "express";

const storage = multer.memoryStorage();

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

// When a non-image file is rejected, the reason is stashed on the request so the
// route handler can turn it into a regular HTTP 400 response (no exception thrown).
export type FileRejection = { fileRejectionReason?: string };

export const upload = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_BYTES },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) { cb(undefined as never, true); return; }
    (req as Request & FileRejection).fileRejectionReason = "Only image files are allowed";
    cb(undefined as never, false);
  },
});
