import {
  IsString,
  IsMongoId,
  IsMobilePhone,
  IsOptional,
  IsEmail,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsDateString,
  Min,
  Max,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

/**
 * Update DTO for Lead.
 * All fields are optional; only provided fields will be updated.
 */
export class UpdateLeadDto {
  @ApiPropertyOptional({
    example: "Jane Doe",
    description: "Full name of the lead",
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    example: "+919876543210",
    description: "Mobile phone number",
  })
  @IsMobilePhone()
  @IsOptional()
  mobile?: string;

  @ApiPropertyOptional({
    example: "Karnataka",
    description: "State of the lead",
  })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({
    example: "Bangalore",
    description: "City of the lead",
  })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({
    example: "123 Main Street",
    description: "Address of the lead",
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: "560001", description: "Pincode/ZIP code" })
  @IsString()
  @IsOptional()
  pincode?: string;

  @ApiPropertyOptional({
    example: "jane.doe@example.com",
    description: "Email address of the lead",
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    example: "60d0fe4f5311236168a109ca",
    description: "Influencer id (mongo id)",
  })
  @IsMongoId()
  @IsOptional()
  influencerId?: string;

  @ApiPropertyOptional({
    example: "SRC123",
    description: "Source code assigned to the lead",
  })
  @IsString()
  @IsOptional()
  sourceCode?: string;

  @ApiPropertyOptional({
    example: "CONNECTED",
    enum: ["CONNECTED", "NOT_CONNECTED", "WRONG"],
    description: "Latest call status",
  })
  @IsEnum(["CONNECTED", "NOT_CONNECTED", "WRONG"])
  @IsOptional()
  callStatus?: "CONNECTED" | "NOT_CONNECTED" | "WRONG";

  @ApiPropertyOptional({
    example: 4,
    description: "Rating from 1 to 5",
    minimum: 1,
    maximum: 5,
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  rating?: number;

  @ApiPropertyOptional({
    example: "Left a voicemail",
    description: "Notes about the lead",
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    example: "2026-02-01T10:00:00Z",
    description: "Follow-up date (ISO string)",
  })
  @IsDateString()
  @IsOptional()
  followUpDate?: string;

  @ApiPropertyOptional({
    example: false,
    description: "Whether lead has been converted to sale",
  })
  @IsBoolean()
  @IsOptional()
  converted?: boolean;

  @ApiPropertyOptional({
    example: "NO",
    enum: ["APPLIED", "YES", "NO"],
    description: "GST status: APPLIED | YES | NO",
  })
  @IsEnum(["APPLIED", "YES", "NO"])
  @IsOptional()
  gstStatus?: "APPLIED" | "YES" | "NO";

  @ApiPropertyOptional({
    example: null,
    description: "Sales amount (null if not converted)",
  })
  @IsNumber()
  @IsOptional()
  salesAmount?: number | null;
}

