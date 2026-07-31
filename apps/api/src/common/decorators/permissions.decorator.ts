import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Declares which (module, action) permission pairs are required to hit a route,
 * per the Phase 0 RBAC matrix (kickoff §4). Example:
 *   @Permissions({ module: 'core-admin', action: 'edit' })
 */
export interface RequiredPermission {
  module: string;
  action: 'view' | 'create' | 'edit' | 'delete' | 'approve';
}

export const Permissions = (...permissions: RequiredPermission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
