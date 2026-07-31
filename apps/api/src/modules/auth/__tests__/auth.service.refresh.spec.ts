import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { UsersService } from '../../users/users.service';
import { RolesService } from '../../roles/roles.service';
import { TenantsService } from '../../tenants/tenants.service';
import { ParentStudentLinksService } from '../../students/parent-student-links.service';

/**
 * Regression test for the bug where refresh() reused a decoded JWT payload
 * (which already carries its own exp/iat claims) directly as the payload for
 * newly-signed tokens, causing the JWT library to reject every refresh with
 * "Bad options.expiresIn option the payload already has an exp property" —
 * surfaced to the client as a misleading 401.
 *
 * TenantsService and ParentStudentLinksService were added to AuthService's
 * constructor later (platform-level Super Admin login, parent-student
 * linking) but this test's provider list wasn't updated to match at the
 * time — added back here as simple mocks since refresh() itself never
 * calls either of them.
 */
describe('AuthService.refresh', () => {
  it('re-issues tokens without conflicting on exp/iat from the decoded refresh token', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: { findByEmailWithPassword: jest.fn() },
        },
        {
          provide: RolesService,
          useValue: { findOne: jest.fn().mockResolvedValue({ id: 'role-1', name: 'School Admin' }) },
        },
        {
          provide: TenantsService,
          useValue: { findBySubdomain: jest.fn(), findAll: jest.fn(), findOne: jest.fn() },
        },
        {
          provide: ParentStudentLinksService,
          useValue: { findStudentIdsForParent: jest.fn().mockResolvedValue([]) },
        },
        JwtService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string, fallback?: string) =>
              ({
                JWT_ACCESS_SECRET: 'test-access-secret',
                JWT_REFRESH_SECRET: 'test-refresh-secret',
                JWT_ACCESS_TTL: '15m',
                JWT_REFRESH_TTL: '7d',
              })[key] ?? fallback,
          },
        },
      ],
    }).compile();

    const authService = moduleRef.get(AuthService);
    const jwtService = moduleRef.get(JwtService);

    const refreshToken = jwtService.sign(
      { sub: 'user-1', tenantId: 'tenant-1', roleId: 'role-1', roleName: 'School Admin', email: 'a@b.com' },
      { secret: 'test-refresh-secret', expiresIn: '7d' },
    );

    const result = await authService.refresh(refreshToken);

    expect(result.access_token).toBeDefined();
    expect(result.refresh_token).toBeDefined();
    expect(result.user.email).toBe('a@b.com');
  });
});
