import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class StorageService {
  private readonly uploadDirectory = path.join(
    process.cwd(),
    'uploads',
  );

  constructor() {
    if (!fs.existsSync(this.uploadDirectory)) {
      fs.mkdirSync(this.uploadDirectory, {
        recursive: true,
      });
    }
  }

  saveFile(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    return {
      message: 'File uploaded successfully',
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: `/storage/${file.filename}`,
    };
  }

  getFilePath(filename: string) {
    const safeFilename = path.basename(filename);

    const filePath = path.join(
      this.uploadDirectory,
      safeFilename,
    );

    if (!fs.existsSync(filePath)) {
      return null;
    }

    return filePath;
  }

  deleteFile(filename: string) {
    const filePath = this.getFilePath(filename);

    if (!filePath) {
      return {
        message: 'File not found',
      };
    }

    fs.unlinkSync(filePath);

    return {
      message: 'File deleted successfully',
    };
  }
}