import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/models/user.entity';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
import { Purchase } from './models/purchase.entity';

@Injectable()
export class PurchaseService {
  constructor(
    @InjectRepository(Purchase)
    private readonly purchaseRepository: Repository<Purchase>,
  ) {}

  async create(userId: number, data: CreatePurchaseDto): Promise<Purchase> {
    const purchase = this.purchaseRepository.create({
      purchase_date: data.purchase_date,
      purchase_amount: data.purchase_amount,
      sale_amount: data.sale_amount,
      profit: this.calculateProfit(data.purchase_amount, data.sale_amount),
      user: { id: userId } as User,
    });

    return this.purchaseRepository.save(purchase);
  }

  async findAll(userId: number): Promise<Purchase[]> {
    return this.purchaseRepository.find({
      where: { user: { id: userId } },
      order: { purchase_date: 'DESC', id: 'DESC' },
    });
  }

  async findOne(userId: number, id: number): Promise<Purchase> {
    const purchase = await this.purchaseRepository.findOne({
      where: { id, user: { id: userId } },
    });

    if (!purchase) {
      throw new NotFoundException('Purchase not found');
    }

    return purchase;
  }

  async update(
    userId: number,
    id: number,
    data: UpdatePurchaseDto,
  ): Promise<Purchase> {
    const purchase = await this.findOne(userId, id);

    if (data.purchase_date !== undefined) {
      purchase.purchase_date = data.purchase_date;
    }

    if (data.purchase_amount !== undefined) {
      purchase.purchase_amount = data.purchase_amount;
    }

    if (data.sale_amount !== undefined) {
      purchase.sale_amount = data.sale_amount;
    }

    purchase.profit = this.calculateProfit(
      purchase.purchase_amount,
      purchase.sale_amount,
    );

    return this.purchaseRepository.save(purchase);
  }

  async remove(userId: number, id: number): Promise<{ deleted: boolean }> {
    const purchase = await this.findOne(userId, id);
    await this.purchaseRepository.remove(purchase);

    return { deleted: true };
  }

  private calculateProfit(purchaseAmount: number, saleAmount: number): number {
    return Number((Number(saleAmount) - Number(purchaseAmount)).toFixed(2));
  }
}
