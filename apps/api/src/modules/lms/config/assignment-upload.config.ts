import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';
import { AuthenticatedUser } from '../../../common/decorators/current-user.decorator';

/**
 * Files land under apps/api/uploads/assignments/{tenantId}/{assignmentId}/ —
 * a plain folder on disk (the API runs directly on the host per this
 * project's setup, not in Docker, so no volume config is needed). Local
 * disk for now, per decision — revisit for real S3-compatible storage
 * before this goes anywhere near production/multi-instance deployment.
 *
 * Deliberately conservative defaults, adjustable here if they don't fit:
 * 25MB cap, common assignment file types only. Video is NOT included here
 * on purpose — that's the separate Lecture Library upload, with its own
 * (larger) limits, not this one.
 */
export const ASSIGNMENT_UPLOAD_ROOT = join(process.cwd(), 'uploads', 'assignments');

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'image/jpeg',
  'image/png',
  'application/zip',
  'text/plain',
]);

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB

export const assignmentUploadOptions = {
  storage: diskStorage({
    // req is typed `any` here deliberately — Express's own User interface
    // (from Passport's global augmentation) doesn't know about our
    // AuthenticatedUser shape, and this project has no global type
    // augmentation teaching it that. Casting req.user explicitly below is
    // simpler and more contained than adding a project-wide declaration
    // just for this one file.
    destination: (req: any, _file, cb) => {
      const currentUser = req.user as AuthenticatedUser | undefined;
      const assignmentId = req.params.assignmentId ?? req.body.assignment_id;
      const tenantId = currentUser?.tenantId ?? 'unknown-tenant';
      const dir = join(ASSIGNMENT_UPLOAD_ROOT, tenantId, assignmentId ?? 'unknown-assignment');
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req: any, file, cb) => {
      const currentUser = req.user as AuthenticatedUser | undefined;
      // studentId is set on req.user by JwtStrategy — using it (not a
      // client-supplied value) keeps the filename tied to the verified
      // caller, consistent with how student_id itself is derived server-side.
      const studentId = currentUser?.studentId ?? 'unknown-student';
      const safeExt = extname(file.originalname).slice(0, 10).replace(/[^a-zA-Z0-9.]/g, '');
      cb(null, `${studentId}-${Date.now()}${safeExt}`);
    },
  }),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req: any, file: Express.Multer.File, cb: (error: Error | null, acceptFile: boolean) => void) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(new BadRequestException(`File type ${file.mimetype} is not allowed for assignment submissions`), false);
      return;
    }
    cb(null, true);
  },
};