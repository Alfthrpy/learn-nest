import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty()
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    position: {
      id: number;
      name: string;
    };
    permissions: string[];
  };
}
