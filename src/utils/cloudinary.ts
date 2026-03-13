import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "silverlog/avatars",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [
      { width: 256, height: 256, crop: "fill", gravity: "face" },
    ],
  } as any,
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

export const deleteAvatarFromCloudinary = async (filename: string) => {
  try {
    const fullPublicId = `silverlog/avatars/${filename}`;
    await cloudinary.uploader.destroy(fullPublicId);
  } catch (error) {
    console.error("Erreur à la suppression de l'avatar:", error);
  }
};

const storageBanner = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "silverlog/banners",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 1200, height: 675, crop: "fill" }],
  } as any,
});

export const uploadBanner = multer({
  storage: storageBanner,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

export const deleteBannerFromCloudinary = async (filename: string) => {
  try {
    const fullPublicId = `silverlog/banners/${filename}`;
    await cloudinary.uploader.destroy(fullPublicId);
  } catch (error) {
    console.error("Erreur à la suppression du banner:", error);
  }
};
