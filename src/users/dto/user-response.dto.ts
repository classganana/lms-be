import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ example: '60d0fe4f5311236168a109ca', description: 'User ID' })
  id: string;

  @ApiProperty({ example: 'John Doe', description: 'Full name of the user' })
  name: string;

  @ApiProperty({ example: 'john.doe@example.com', description: 'Email address' })
  email: string;

  @ApiProperty({ example: '9876543210', description: 'Mobile number' })
  mobile: string;

  @ApiProperty({ example: 'NON_ADMIN', enum: ['ADMIN', 'NON_ADMIN'], description: 'User role' })
  role: 'ADMIN' | 'NON_ADMIN';

  @ApiProperty({ example: true, description: 'Whether user is active' })
  isActive: boolean;

  @ApiProperty({ example: '2026-01-22T16:07:52.623Z', description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ example: '2026-01-22T16:07:52.623Z', description: 'Last update timestamp' })
  updatedAt: Date;
}
