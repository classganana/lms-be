import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  IsBoolean,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateUserDto {
  @ApiPropertyOptional({
    example: "John Doe",
    description: "Full name of the user",
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    example: "john.doe@example.com",
    description: "Email address (must be unique)",
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: "9876543210", description: "Mobile number" })
  @IsString()
  @IsOptional()
  mobile?: string;

  @ApiPropertyOptional({
    example: "SecurePassword123!",
    description: "Password (minimum 6 characters)",
  })
  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;

  @ApiPropertyOptional({
    example: "NON_ADMIN",
    enum: ["ADMIN", "NON_ADMIN"],
    description: "User role",
  })
  @IsEnum(["ADMIN", "NON_ADMIN"])
  @IsOptional()
  role?: "ADMIN" | "NON_ADMIN";

  @ApiPropertyOptional({ example: true, description: "Whether user is active" })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
