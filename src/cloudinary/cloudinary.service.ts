// src/common/cloudinary/cloudinary.service.ts
import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import * as streamifier from 'streamifier';

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

 async uploadFile(file: Express.Multer.File): Promise<string> {
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        { 
          resource_type: 'image', 
          folder: 'mistral_cafe' 
        },
        (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
          if (error) return reject(error);
          if (!result) return reject(new Error('Cloudinary upload result is undefined'));
          resolve(result.secure_url);
        },
      );
      upload.end(file.buffer);
    });
  }
  async deleteFile(publicId: string,) {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(
        publicId, 
        { resource_type: 'image' },
        (error, result) => {
          if (error) {
            console.error("Cloudinary Destroy Error:", error);
            return reject(error);
          }
          resolve(result);
        }
      );
    });
  }
}