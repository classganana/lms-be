import { IsEnum, IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateSourceCodeStatusDto {
  @ApiProperty({
    example: "SRC123",
    description: "Source code to update",
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    example: "ACTIVE",
    enum: ["ACTIVE", "INACTIVE"],
    description: "New status for the source code",
  })
  @IsEnum(["ACTIVE", "INACTIVE"])
  status: "ACTIVE" | "INACTIVE";
}
