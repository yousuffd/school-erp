import { BadRequestException } from '@nestjs/common';
import { CommunicationService } from '../communication.service';
import { AudienceScope } from '../entities/circular.entity';

/**
 * Covers the one hand-written business rule in CommunicationService: a
 * circular's audience targeting must be internally consistent (a
 * 'grade'-scoped circular needs a grade specified, etc.) — otherwise it'd
 * silently reach nobody or everybody depending on how a query happened to
 * read the malformed row later.
 */
describe('CommunicationService.create', () => {
  function makeService() {
    const circularRepo: any = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((c) => Promise.resolve(c)),
    };
    const receiptRepo: any = {};
    const studentRepo: any = {};
    return new CommunicationService(circularRepo, receiptRepo, studentRepo);
  }

  const base = { tenant_id: 'tenant-1', title: 'Test', body: 'Body text' };

  it('rejects a grade-scoped circular with no grade level specified', async () => {
    const service = makeService();
    await expect(
      service.create({ ...base, audience_scope: AudienceScope.GRADE }, 'user-1'),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects a class-scoped circular with no class specified', async () => {
    const service = makeService();
    await expect(
      service.create({ ...base, audience_scope: AudienceScope.CLASS }, 'user-1'),
    ).rejects.toThrow(BadRequestException);
  });

  it('accepts a whole_school circular with no grade/class specified', async () => {
    const service = makeService();
    await expect(
      service.create({ ...base, audience_scope: AudienceScope.WHOLE_SCHOOL }, 'user-1'),
    ).resolves.toBeDefined();
  });

  it('clears stray grade/class values on a whole_school circular', async () => {
    const service = makeService();
    const result = await service.create(
      { ...base, audience_scope: AudienceScope.WHOLE_SCHOOL, audience_grade_level: 'Grade 5' },
      'user-1',
    );
    expect(result.audience_grade_level).toBeUndefined();
  });

  it('accepts a properly-specified grade-scoped circular', async () => {
    const service = makeService();
    await expect(
      service.create(
        { ...base, audience_scope: AudienceScope.GRADE, audience_grade_level: 'Grade 5' },
        'user-1',
      ),
    ).resolves.toBeDefined();
  });
});
