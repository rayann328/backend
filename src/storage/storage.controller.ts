import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';

import type { Response } from 'express';

import { diskStorage } from 'multer';
import { extname } from 'path';

import { StorageService } from './storage.service';

@Controller('storage')
export class StorageController {
  constructor(
    private readonly storageService: StorageService,
  ) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (
          req: Express.Request,
          file: Express.Multer.File,
          callback: (
            error: Error | null,
            filename: string,
          ) => void,
        ) => {
          const uniqueName =
            `${Date.now()}-${Math.round(Math.random() * 1e9)}` +
            extname(file.originalname);

          callback(null, uniqueName);
        },
      }),

      limits: {
        fileSize: 5 * 1024 * 1024,
      },

      fileFilter: (
        req: Express.Request,
        file: Express.Multer.File,
        callback: (
          error: Error | null,
          acceptFile: boolean,
        ) => void,
      ) => {
        if (!file.mimetype.startsWith('image/')) {
          return callback(
            new Error('Only image files are allowed'),
            false,
          );
        }

        callback(null, true);
      },
    }),
  )
  uploadFile(
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.storageService.saveFile(file);
  }

  @Get(':filename')
  getFile(
    @Param('filename') filename: string,
    @Res() response: Response,
  ) {
    const filePath =
      this.storageService.getFilePath(filename);

    if (!filePath) {
      return response.status(404).json({
        message: 'File not found',
      });
    }

    return response.sendFile(filePath);
  }

  @Delete(':filename')
  deleteFile(
    @Param('filename') filename: string,
  ) {
    return this.storageService.deleteFile(
      filename,
    );
  }
}