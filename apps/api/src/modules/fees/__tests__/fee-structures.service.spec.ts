import { BadRequestException } from '@nestjs/common';
import { FeeStructuresService } from '../fee-structures.service';

/**
 * Covers the one hand-written business rule in FeeStructuresService: a fee
 * structure's installment plan must add up to the same total as its
 * components. A mismatch would silently under- or over-charge every student
 * the structure gets assigned to — worth catching at creation, not later.
 */
describe('FeeStructuresService.create', () => {
  function makeService() {
    const structureRepo: any = {
      create: jest.fn().mockImplementation((dto) => ({ id: 'structure-1', ...dto })),
      save: jest.fn().mockImplementation((s) => Promise.resolve(s)),
      findOne: jest.fn().mockResolvedValue({ id: 'structure-1', components: [], installments: [] }),
    };
    const componentRepo: any = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockResolvedValue([]),
    };
    const installmentRepo: any = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockResolvedValue([]),
    };
    return { service: new FeeStructuresService(structureRepo, componentRepo, installmentRepo) };
  }

  const baseDto = {
    tenant_id: 'tenant-1',
    academic_year_id: 'year-1',
    grade_level: 'Grade 5',
    name: 'Grade 5 Fees 2026-27',
  };

  it('accepts a structure whose installments sum to the same total as its components', async () => {
    const { service } = makeService();
    await expect(
      service.create({
        ...baseDto,
        components: [{ name: 'Tuition', amount: '30000' }, { name: 'Transport', amount: '10000' }],
        installments: [{ label: 'Term 1', due_date: '2026-06-15', amount: '20000' }, { label: 'Term 2', due_date: '2026-10-15', amount: '20000' }],
      }),
    ).resolves.toBeDefined();
  });

  it('rejects a structure whose installments do not add up to the component total', async () => {
    const { service } = makeService();
    await expect(
      service.create({
        ...baseDto,
        components: [{ name: 'Tuition', amount: '30000' }],
        installments: [{ label: 'Term 1', due_date: '2026-06-15', amount: '20000' }], // only 20000, not 30000
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
