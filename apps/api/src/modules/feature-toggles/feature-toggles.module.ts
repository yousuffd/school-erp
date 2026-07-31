// apps/api/src/modules/feature-toggles/feature-toggles.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantFeatureToggle } from './entities/tenant-feature-toggle.entity';
import { FeatureTogglesService } from './feature-toggles.service';
import { FeatureTogglesController } from './feature-toggles.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TenantFeatureToggle])],
  controllers: [FeatureTogglesController],
  providers: [FeatureTogglesService],
  exports: [FeatureTogglesService],
})
export class FeatureTogglesModule {}