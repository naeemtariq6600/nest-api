import { DataSource } from 'typeorm';
import { Purchase } from '../purchase/models/purchase.entity';
import { User } from '../user/models/user.entity';

export default new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST ?? 'db',
  port: parseInt(process.env.DB_PORT ?? '3306', 10),
  username: process.env.DB_USERNAME ?? 'root',
  password: process.env.DB_PASSWORD ?? 'root',
  database: process.env.DB_DATABASE ?? 'admin',
  entities: [User, Purchase],
  migrations: ['dist/migrations/*.js'],
  synchronize: false,
});
