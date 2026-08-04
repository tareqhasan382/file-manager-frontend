export const BASE_URL = import.meta.env.VITE_APP_BASE_URL as string;

export const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_APP_Cloud_name as string;
export const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_APP_preset_name as string;
export const CLOUDINARY_API_KEY = import.meta.env.VITE_APP_CLOUDINARY_API as string;

export const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;
