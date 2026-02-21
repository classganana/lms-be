import {
  IsNotEmpty,
  IsMongoId,
  IsNumber,
  IsEnum,
  IsDateString,
  Min,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ConvertLeadDto {
  @ApiProperty({
    example: "60d0fe4f5311236168a109ca",
    description: "Lead id to convert",
  })
  @IsMongoId()
  @IsNotEmpty()
  leadId: string;

  @ApiProperty({
    example: 2500,
    description: "Sale amount in the smallest currency unit",
  })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  saleAmount: number;

  @ApiProperty({
    example: "YES",
    enum: ["APPLIED", "YES", "NO"],
    description: "GST status: APPLIED | YES | NO",
  })
  @IsEnum(["APPLIED", "YES", "NO"])
  @IsNotEmpty()
  gstStatus: "APPLIED" | "YES" | "NO";

  @ApiProperty({
    example: "2026-01-21T10:00:00Z",
    description: "Sale date (ISO string)",
  })
  @IsDateString()
  @IsNotEmpty()
  saleDate: string;
}
