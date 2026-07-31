import { IsBoolean } from 'class-validator';

export class SetTransportPreferenceDto {
  @IsBoolean()
  wantsTransport: boolean;
}
