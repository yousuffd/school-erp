import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleAsyncOptions, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';

const buildOptions = (config: ConfigService): DataSourceOptions => ({
  type: 'postgres',
  host: config.get('DB_HOST', 'localhost'),
  port: parseInt(config.get('DB_PORT', '5432'), 10),
  username: config.get('DB_USERNAME', 'school_erp'),
  password: config.get('DB_PASSWORD', 'school_erp'),
  database: config.get('DB_DATABASE', 'school_erp'),
  entities: [__dirname + '/../modules/**/entities/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../../migrations/*{.ts,.js}'],
  synchronize: config.get('DB_SYNCHRONIZE', 'false') === 'true',
  logging: config.get('DB_LOGGING', 'false') === 'true',
});

export const typeOrmConfig: TypeOrmModuleAsyncOptions = {
  inject: [ConfigService],
  useFactory: (config: ConfigService): TypeOrmModuleOptions => buildOptions(config),
};

// Used by the TypeORM CLI for migrations (npm run migration:generate/run).
const cliConfigService = new ConfigService();
export default new DataSource(buildOptions(cliConfigService));
