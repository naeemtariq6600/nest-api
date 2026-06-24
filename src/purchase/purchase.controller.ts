import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
import { Purchase } from './models/purchase.entity';
import { PurchaseService } from './purchase.service';

@UseGuards(JwtAuthGuard)
@Controller('purchases')
export class PurchaseController {
  constructor(private readonly purchaseService: PurchaseService) {}

  @Post()
  create(
    @CurrentUser('sub') userId: number,
    @Body() body: CreatePurchaseDto,
  ): Promise<Purchase> {
    return this.purchaseService.create(userId, body);
  }

  @Get()
  findAll(@CurrentUser('sub') userId: number): Promise<Purchase[]> {
    return this.purchaseService.findAll(userId);
  }

  @Get('reports/today')
  todayReport(
    @CurrentUser('sub') userId: number,
  ): Promise<{ total_purchase: number; total_profit: number }> {
    return this.purchaseService.todayReport(userId);
  }

  @Get('reports/current-month')
  currentMonthReport(
    @CurrentUser('sub') userId: number,
  ): Promise<{ total_purchase: number; total_profit: number }> {
    return this.purchaseService.currentMonthReport(userId);
  }

  @Get('reports/date-wise')
  dateWiseReport(
    @CurrentUser('sub') userId: number,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
  ): Promise<{ date: string; total_purchase: number; total_profit: number }[]> {
    return this.purchaseService.dateWiseReport(userId, startDate, endDate);
  }

  @Get('reports/list')
  findByDateRange(
    @CurrentUser('sub') userId: number,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
  ): Promise<Purchase[]> {
    return this.purchaseService.findByDateRange(userId, startDate, endDate);
  }

  @Get('reports/month-wise')
  monthWiseReport(
    @CurrentUser('sub') userId: number,
    @Query('start_month') startMonth: string,
    @Query('end_month') endMonth: string,
  ): Promise<
    { month: string; total_purchase: number; total_profit: number }[]
  > {
    return this.purchaseService.monthWiseReport(userId, startMonth, endMonth);
  }

  @Get(':id')
  findOne(
    @CurrentUser('sub') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Purchase> {
    return this.purchaseService.findOne(userId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser('sub') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdatePurchaseDto,
  ): Promise<Purchase> {
    return this.purchaseService.update(userId, id, body);
  }

  @Delete(':id')
  remove(
    @CurrentUser('sub') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ deleted: boolean }> {
    return this.purchaseService.remove(userId, id);
  }
}
