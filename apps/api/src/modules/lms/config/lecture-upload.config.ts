import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';

export const LECTURE_UPLOAD_ROOT = join(process.cwd(), 'uploads', 'lectures');

const ALLOWED_VIDEO_MIME_TYPES = new Set(['video/mp4', 'video/webm', 'video/quicktime']);

const MAX_VIDEO_SIZE_BYTES = 500 * 1024 * 1024; // 500MB — real lecture recordings are large; adjust here if this doesn't fit real usage

export const lectureUploadOptions = {
  storage: diskStorage({
    destination: (req: any, _file, cb) => {
      const tenantId = req.body?.tenant_id ?? 'unknown-tenant';
      const dir = join(LECTURE_UPLOAD_ROOT, tenantId);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (_req: any, file, cb) => {
      const safeExt = extname(file.originalname).slice(0, 10).replace(/[^a-zA-Z0-9.]/g, '');
      cb(null, `${randomUUID()}${safeExt}`);
    },
  }),
  limits: { fileSize: MAX_VIDEO_SIZE_BYTES },
  fileFilter: (_req: any, file: Express.Multer.File, cb: (error: Error | null, acceptFile: boolean) => void) => {
    if (!ALLOWED_VIDEO_MIME_TYPES.has(file.mimetype)) {
      cb(new BadRequestException(`File type ${file.mimetype} is not allowed — upload MP4, WebM, or MOV only`), false);
      return;
    }
    cb(null, true);
  },
};
