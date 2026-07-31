import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateAdmissionDto } from './create-admission.dto';

// tenant_id is set at creation and not editable; stage and enrollment have
// their own dedicated endpoints below so those workflow events stay
// auditable rather than being incidental field edits.
export class UpdateAdmissionDto extends PartialType(
  OmitType(CreateAdmissionDto, ['tenant_id'] as const),
) {}
