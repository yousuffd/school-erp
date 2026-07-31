import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '../../modules/auth/strategies/jwt.strategy';

/**
 * Applied ONLY to POST /tenants (TenantsController) via @UseGuards() at the
 * route level. That route stays @Public() — which makes the GLOBAL
 * JwtAuthGuard and RbacGuard both short-circuit to `return true` immediately
 * (both check the same IS_PUBLIC_KEY metadata) — so this guard is the ONLY
 * real enforcement on tenant creation. Previously there was none at all:
 * @Public() + no @Permissions() meant any request, authenticated or not,
 * reached TenantsService.provision() unchecked.
 *
 * Two ways through, either is sufficient:
 *   1. A valid x-provisioning-api-key header matching PROVISIONING_API_KEY
 *      (a new env var — add it to .env) — the "no user account exists yet"
 *      bootstrap path: the very first tenant ever, or an unattended
 *      provisioning script with no logged-in session.
 *   2. A valid Bearer JWT whose roleName is 'Super Admin' — the normal,
 *      ongoing "logged-in platform staff onboarding a new school" path
 *      (see ProvisionTenantPage on the frontend). Trusts payload.roleName
 *      directly from the verified, signature-checked token rather than
 *      re-querying the role from the DB — same trust model RbacGuard's own
 *      Super Admin bypass already uses (user.roleName there is likewise
 *      just passed through from the JWT payload, never re-checked), not a
 *      weaker standard introduced just for this route.
 *
 * JWT verification here is manual (JwtService.verify(), not the passport
 * Strategy/JwtAuthGuard) for the same reason AuthService.refresh() already
 * does this — this guard runs on an explicitly @Public() route, so the
 * normal JwtStrategy pipeline never touches this request at all.
 */
@Injectable()
export class TenantProvisioningGuard implements CanActivate {
  constructor(
    private readonly config: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    const providedKey = request.headers['x-provisioning-api-key'];
    const configuredKey = this.config.get<string>('PROVISIONING_API_KEY');
    // configuredKey must be truthy (a real value actually set in .env)
    // before it's ever compared — an unset env var must never accidentally
    // match an equally-absent header, which is why this short-circuits on
    // `configuredKey &&` rather than comparing two possibly-undefined values.
    if (configuredKey && providedKey === configuredKey) {
      return true;
    }

    const authHeader = request.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Provisioning requires either a valid provisioning API key or an authenticated Super Admin session.',
      );
    }

    const token = authHeader.slice('Bearer '.length);
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired access token.');
    }

    if (payload.roleName !== 'Super Admin') {
      throw new ForbiddenException('Only Super Admin may provision new tenants.');
    }

    return true;
  }
}
