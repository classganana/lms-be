import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'John Doe', description: 'Full name of the user' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'john.doe@example.com', description: 'Email address (must be unique)' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '9876543210', description: 'Mobile number' })
  @IsString()
  @IsNotEmpty()
  mobile: string;

  @ApiProperty({ example: 'SecurePassword123!', description: 'Password (minimum 6 characters)' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'NON_ADMIN', enum: ['ADMIN', 'NON_ADMIN'], description: 'User role' })
  @IsEnum(['ADMIN', 'NON_ADMIN'])
  @IsNotEmpty()
  role: 'ADMIN' | 'NON_ADMIN';

  @ApiProperty({ example: true, required: false, description: 'Whether user is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
