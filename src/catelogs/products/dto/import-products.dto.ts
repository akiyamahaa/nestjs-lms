import { ApiProperty } from '@nestjs/swagger';

export class ImportProductsDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'JSON file containing products data'
  })
  file: Express.Multer.File;
}