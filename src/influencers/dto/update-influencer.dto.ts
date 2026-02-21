import { IsOptional, IsString, IsBoolean } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateInfluencerDto {
  @ApiPropertyOptional({
    example: "John Doe",
    description: "Name of the influencer",
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    example: true,
    description: "Whether influencer is active. Omit to leave unchanged.",
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
