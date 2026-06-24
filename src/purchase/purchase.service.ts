import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository, SelectQueryBuilder } from 'typeorm';
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
      item_name: data.item_name,
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

  async todayReport(
    userId: number,
  ): Promise<{ total_purchase: number; total_profit: number }> {
    const raw = await this.summaryQuery(userId)
      .andWhere('purchase.purchase_date = CURRENT_DATE()')
      .getRawOne();

    return this.normalizeSummary(raw);
  }

  async currentMonthReport(
    userId: number,
  ): Promise<{ total_purchase: number; total_profit: number }> {
    const raw = await this.summaryQuery(userId)
      .andWhere('YEAR(purchase.purchase_date) = YEAR(CURRENT_DATE())')
      .andWhere('MONTH(purchase.purchase_date) = MONTH(CURRENT_DATE())')
      .getRawOne();

    return this.normalizeSummary(raw);
  }

  async dateWiseReport(
    userId: number,
    startDate: string,
    endDate: string,
  ): Promise<{ date: string; total_purchase: number; total_profit: number }[]> {
    this.validateDateRange(startDate, endDate);

    const rows = await this.purchaseRepository
      .createQueryBuilder('purchase')
      .select("DATE_FORMAT(purchase.purchase_date, '%Y-%m-%d')", 'date')
      .addSelect('COALESCE(SUM(purchase.purchase_amount), 0)', 'total_purchase')
      .addSelect('COALESCE(SUM(purchase.profit), 0)', 'total_profit')
      .where('purchase.user_id = :userId', { userId })
      .andWhere('purchase.purchase_date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('purchase.purchase_date')
      .orderBy('purchase.purchase_date', 'ASC')
      .getRawMany();

    return rows.map((row) => ({
      date: row.date,
      total_purchase: this.toMoneyNumber(row.total_purchase),
      total_profit: this.toMoneyNumber(row.total_profit),
    }));
  }

  async findByDateRange(
    userId: number,
    startDate: string,
    endDate: string,
  ): Promise<Purchase[]> {
    this.validateDateRange(startDate, endDate);

    return this.purchaseRepository.find({
      where: {
        user: { id: userId },
        purchase_date: Between(startDate, endDate),
      },
      order: { purchase_date: 'ASC', id: 'ASC' },
    });
  }

  async monthWiseReport(
    userId: number,
    startMonth: string,
    endMonth: string,
  ): Promise<
    { month: string; total_purchase: number; total_profit: number }[]
  > {
    this.validateMonthRange(startMonth, endMonth);

    const startDate = `${startMonth}-01`;
    const endDate = this.getLastDateOfMonth(endMonth);
    const rows = await this.purchaseRepository
      .createQueryBuilder('purchase')
      .select("DATE_FORMAT(purchase.purchase_date, '%Y-%m')", 'month')
      .addSelect('COALESCE(SUM(purchase.purchase_amount), 0)', 'total_purchase')
      .addSelect('COALESCE(SUM(purchase.profit), 0)', 'total_profit')
      .where('purchase.user_id = :userId', { userId })
      .andWhere('purchase.purchase_date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy("DATE_FORMAT(purchase.purchase_date, '%Y-%m')")
      .orderBy('month', 'ASC')
      .getRawMany();

    return rows.map((row) => ({
      month: row.month,
      total_purchase: this.toMoneyNumber(row.total_purchase),
      total_profit: this.toMoneyNumber(row.total_profit),
    }));
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

    if (data.item_name !== undefined) {
      purchase.item_name = data.item_name;
    }

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

  private summaryQuery(userId: number): SelectQueryBuilder<Purchase> {
    return this.purchaseRepository
      .createQueryBuilder('purchase')
      .select('COALESCE(SUM(purchase.purchase_amount), 0)', 'total_purchase')
      .addSelect('COALESCE(SUM(purchase.profit), 0)', 'total_profit')
      .where('purchase.user_id = :userId', { userId });
  }

  private normalizeSummary(raw?: {
    total_purchase?: string | number;
    total_profit?: string | number;
  }): { total_purchase: number; total_profit: number } {
    return {
      total_purchase: this.toMoneyNumber(raw?.total_purchase ?? 0),
      total_profit: this.toMoneyNumber(raw?.total_profit ?? 0),
    };
  }

  private toMoneyNumber(value: string | number): number {
    return Number(Number(value).toFixed(2));
  }

  private validateDateRange(startDate: string, endDate: string): void {
    if (!this.isValidDate(startDate) || !this.isValidDate(endDate)) {
      throw new BadRequestException(
        'start_date and end_date must use YYYY-MM-DD format',
      );
    }

    if (startDate > endDate) {
      throw new BadRequestException('start_date must be before end_date');
    }
  }

  private validateMonthRange(startMonth: string, endMonth: string): void {
    if (!this.isValidMonth(startMonth) || !this.isValidMonth(endMonth)) {
      throw new BadRequestException(
        'start_month and end_month must use YYYY-MM format',
      );
    }

    if (startMonth > endMonth) {
      throw new BadRequestException('start_month must be before end_month');
    }
  }

  private isValidDate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return false;
    }

    const date = new Date(`${value}T00:00:00.000Z`);
    return date.toISOString().slice(0, 10) === value;
  }

  private isValidMonth(value: string): boolean {
    return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
  }

  private getLastDateOfMonth(month: string): string {
    const [year, monthNumber] = month.split('-').map(Number);
    const date = new Date(Date.UTC(year, monthNumber, 0));

    return date.toISOString().slice(0, 10);
  }
}
