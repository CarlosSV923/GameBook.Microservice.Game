import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@Controller('health')
@ApiTags('Health')
export class HealthController {
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    operationId: 'getGameHealth',
    summary: 'Check Game readiness',
  })
  @ApiResponse({ status: 200, description: 'Game is ready.' })
  getHealth() {
    return { status: 'ok' };
  }
}
