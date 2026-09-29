import { Module } from '@nestjs/common';
import { ApiModule } from './api/api.module.ts';

@Module({
  imports: [ApiModule],
})
export class AppModule {}
