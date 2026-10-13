import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool: Pool;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    this.pool = new Pool({
      host: this.configService.get<string>('DATABASE_HOST', 'localhost'),
      port: this.configService.get<number>('DATABASE_PORT', 5432),
      user: this.configService.get<string>('DATABASE_USER', 'postgres'),
      password: this.configService.get<string>('DATABASE_PASSWORD', 'postgrespassword'),
      database: this.configService.get<string>('DATABASE_NAME', 'dispatch_storefront'),
      max: 25,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ssl: this.configService.get<string>('DATABASE_SSL') === 'true' ? { rejectUnauthorized: false } : false,
    });

    this.pool.on('error', (err) => {
      this.logger.error('Unexpected error on idle PostgreSQL client', err);
    });

    this.logger.log('PostgreSQL connection pool initialized');
  }

  async onModuleDestroy() {
    if (this.pool) {
      await this.pool.end();
      this.logger.log('PostgreSQL pool connection closed');
    }
  }

  async query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    const start = Date.now();
    const res = await this.pool.query<T>(text, params);
    const duration = Date.now() - start;
    if (duration > 500) {
      this.logger.warn(`Slow query detected (${duration}ms): ${text.substring(0, 100)}...`);
    }
    return res;
  }

  async queryOne<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<T | null> {
    const res = await this.query<T>(text, params);
    return res.rows[0] || null;
  }

  async queryMany<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<T[]> {
    const res = await this.query<T>(text, params);
    return res.rows;
  }

  /**
   * Run operations inside a PostgreSQL Transaction.
   * Required for multi-row operations and deferred constraint triggers like assert_ledger_group_balanced()
   */
  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error('Transaction rolled back due to error', error);
      throw error;
    } finally {
      client.release();
    }
  }
}
