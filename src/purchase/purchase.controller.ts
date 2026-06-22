import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
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
