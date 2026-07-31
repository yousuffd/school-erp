import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PayrollSettings } from './entities/payroll-settings.entity';
import { UpdatePayrollSettingsDto } from './dto/update-payroll-settings.dto';
import { scopedRepo } from '../../common/context/tenant-context';

@Injectable()
export class PayrollSettingsService {
  constructor(@InjectRepository(PayrollSettings) private readonly repoRaw: Repository<PayrollSettings>) {}

  private repo(): Repository<PayrollSettings> {
    return scopedRepo(this.repoRaw, PayrollSettings);
  }

  /**
   * Every existing tenant already has a row (seeded by
   * SeedPayrollSettingsForExistingTenants1726600000000). New tenants
   * provisioned after this ships do NOT get one automatically yet — that's
   * a real gap, not an oversight; flagging for TenantsService.provision()
   * follow-up rather than silently working around it here with a fallback
   * default that could mask the gap.
   */
  async findForTenant(tenantId: string): Promise<PayrollSettings | null> {
    return this.repo().findOne({ where: { tenant_id: tenantId } });
  }

  async update(tenantId: string, dto: UpdatePayrollSettingsDto): Promise<PayrollSettings> {
    const settings = await this.findForTenant(tenantId);
    if (!settings) {
      // Self-heals a tenant that's somehow missing its row, rather than
      // hard-failing — same "no row = sensible default" spirit as feature
      // toggles, but here we actively create the row on first edit.
      return this.repo().save(this.repo().create({ tenant_id: tenantId, ...dto }));
    }
    settings.professional_tax_amount = dto.professional_tax_amount;
    return this.repo().save(settings);
  }
}