import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateStudentDto } from './create-student.dto';

// tenant_id/campus_id are set at creation and not editable via the general
// update endpoint. admission_number CAN be corrected here (unlike status or
// class, which are genuine workflow events with their own endpoints) — a
// typo'd admission number is a plain data-entry mistake, not a workflow
// transition, so it belongs in the general edit form. StudentsService.update
// re-checks uniqueness when it changes.
export class UpdateStudentDto extends PartialType(OmitType(CreateStudentDto, ['tenant_id'] as const)) {}
