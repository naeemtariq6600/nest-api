import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../user/models/user.entity';

@Entity('purchases')
export class Purchase {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.purchases, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @RelationId((purchase: Purchase) => purchase.user)
  user_id: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  item_name: string | null;

  @Column({ type: 'date' })
  purchase_date: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  purchase_amount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  sale_amount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  profit: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
