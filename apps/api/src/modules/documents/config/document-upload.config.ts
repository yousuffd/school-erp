import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';

export const DOCUMENT_UPLOAD_ROOT = join(process.cwd(), 'uploads', 'documents');

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/jpeg',
  'image/png',
]);

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

export const documentUploadOptions = {
  storage: diskStorage({
    destination: (req: any, _file, cb) => {
      const tenantId = req.body?.tenant_id ?? 'unknown-tenant';
      const dir = join(DOCUMENT_UPLOAD_ROOT, tenantId);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (_req: any, file, cb) => {
      const safeExt = extname(file.originalname).slice(0, 10).replace(/[^a-zA-Z0-9.]/g, '');
      cb(null, `${randomUUID()}${safeExt}`);
    },
  }),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req: any, file: Express.Multer.File, cb: (error: Error | null, acceptFile: boolean) => void) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(new BadRequestException(`File type ${file.mimetype} is not allowed for documents`), false);
      return;
    }
    cb(null, true);
  },
};
