import multer from "multer";

const storage = multer.memoryStorage();

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

export const upload = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_BYTES },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});
