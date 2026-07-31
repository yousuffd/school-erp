import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RbacGuard } from '../rbac.guard';
import { PHASE_0_ROLE_PERMISSIONS } from '../../../modules/roles/seed/phase0-permission-matrix';
import { SystemRoleName } from '../../../modules/roles/entities/role.entity';

function makeContext(user: any, required: any[], isPublic = false) {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as any;
}

describe('RbacGuard (Phase 0 acceptance criterion #3)', () => {
  let guard: RbacGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RbacGuard(reflector);
  });

  it('blocks a Teacher from a Core Admin route', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key: string) => {
      if (key === 'isPublic') return false;
      if (key === 'permissions') return [{ module: 'core-admin', action: 'view' }];
      return undefined;
    });
    const teacherUser = {
      roleName: SystemRoleName.TEACHER,
      permissions: PHASE_0_ROLE_PERMISSIONS[SystemRoleName.TEACHER],
    };
    expect(() => guard.canActivate(makeContext(teacherUser, []))).toThrow(ForbiddenException);
  });

  it('allows a School Admin onto a Core Admin route', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key: string) => {
      if (key === 'isPublic') return false;
      if (key === 'permissions') return [{ module: 'core-admin', action: 'view' }];
      return undefined;
    });
    const adminUser = {
      roleName: SystemRoleName.SCHOOL_ADMIN,
      permissions: PHASE_0_ROLE_PERMISSIONS[SystemRoleName.SCHOOL_ADMIN],
    };
    expect(guard.canActivate(makeContext(adminUser, []))).toBe(true);
  });

  // it('always allows Super Admin regardless of granted permission list', () => {
  //   jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key: string) => {
  //     if (key === 'isPublic') return false;
  //     if (key === 'permissions') return [{ module: 'tenant-provisioning', action: 'delete' }];
  //     return undefined;
  //   });
  //   const superAdmin = { roleName: SystemRoleName.SUPER_ADMIN, permissions: [] };
  //   expect(guard.canActivate(makeContext(superAdmin, []))).toBe(true);
  // });

  it('denies Super Admin a route it has no explicit permission for', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key: string) => {
      if (key === 'isPublic') return false;
      if (key === 'permissions') return [{ module: 'payroll', action: 'view' }];
      return undefined;
    });
    const superAdmin = { roleName: SystemRoleName.SUPER_ADMIN, permissions: [{ module: 'tenant-provisioning', action: 'view' }] };
    expect(() => guard.canActivate(makeContext(superAdmin, []))).toThrow(ForbiddenException);
  });

  it('allows Super Admin onto a route it does have permission for', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key: string) => {
      if (key === 'isPublic') return false;
      if (key === 'permissions') return [{ module: 'tenant-provisioning', action: 'view' }];
      return undefined;
    });
    const superAdmin = { roleName: SystemRoleName.SUPER_ADMIN, permissions: [{ module: 'tenant-provisioning', action: 'view' }] };
    expect(guard.canActivate(makeContext(superAdmin, []))).toBe(true);
  });
});
