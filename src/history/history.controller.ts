import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { HistoryService } from './history.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('history')
@UseGuards(AuthGuard)
export class HistoryController {
  constructor(
    private readonly historyService: HistoryService,
  ) {}

  @Get()
  findAll(@Req() req: any) {
    return this.historyService.findAll(req.user.sub);
  }

  @Get(':id')
  findOne(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.historyService.findOne(
      req.user.sub,
      id,
    );
  }

  @Post()
  create(
    @Req() req: any,
    @Body() body: any,
  ) {
    return this.historyService.create(
      req.user.sub,
      body,
    );
  }

  @Patch(':id')
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.historyService.update(
      req.user.sub,
      id,
      body,
    );
  }

  @Delete(':id')
  remove(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.historyService.remove(
      req.user.sub,
      id,
    );
  }
}