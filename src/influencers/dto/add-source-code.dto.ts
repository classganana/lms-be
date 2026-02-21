import { IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class AddSourceCodeDto {
  @ApiProperty({
    example: "SRC123",
    description: "Source code to assign to influencer",
  })
  @IsString()
  @IsNotEmpty()
  code: string;
}
