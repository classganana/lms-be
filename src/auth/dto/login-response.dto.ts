import { ApiProperty } from '@nestjs/swagger';

class UserDto {
  @ApiProperty({ example: '60d0fe4f5311236168a109ca' })
  id: string;

  @ApiProperty({ example: 'Jane Doe' })
  name: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'NON_ADMIN', enum: ['ADMIN', 'NON_ADMIN'] })
  role: 'ADMIN' | 'NON_ADMIN';
}

export class LoginResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  access_token: string;

  @ApiProperty({ type: UserDto })
  user: UserDto;
}

