import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsIn, IsString, ValidateNested } from 'class-validator';

class PermissionPairDto {
  @IsString()
  module: string;

  @IsIn(['view', 'create', 'edit', 'delete', 'approve'])
  action: 'view' | 'create' | 'edit' | 'delete' | 'approve';
}

export class UpdateRolePermissionsDto {
  @IsArray()
  @ArrayMinSize(0)
  @ValidateNested({ each: true })
  @Type(() => PermissionPairDto)
  permissions: PermissionPairDto[];
}
