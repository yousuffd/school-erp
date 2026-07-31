import { IsUUID } from 'class-validator';

export class AddMenuItemToDailyMenuDto {
  @IsUUID()
  tenant_id: string;

  @IsUUID()
  menu_item_id: string;
}
