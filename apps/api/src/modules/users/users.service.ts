import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserStatus } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { scopedRepo } from '../../common/context/tenant-context';
import { EntityManager } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  private repo(): Repository<User> {
    return scopedRepo(this.userRepo, User);
  }

  /**
   * tenantIdForRls is provided only by TenantsService.provision() — the
   * @Public() pre-auth path with no ambient per-request tenant context.
   * Every other caller (UsersController, authenticated) omits it and gets
   * the normal scopedRepo()-based path unchanged.
   */
  async create(dto: CreateUserDto, tenantIdForRls?: string, manager?: EntityManager): Promise<User> {
    if (manager && tenantIdForRls) {
      await manager.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantIdForRls]);

      const existing = await manager
        .createQueryBuilder(User, 'user')
        .where('user.tenant_id = :tenantId AND user.email = :email', { tenantId: dto.tenant_id, email: dto.email })
        .getOne();
      if (existing) throw new ConflictException(`Email ${dto.email} already exists for this tenant`);

      const user = manager.create(User, {
        tenant_id: dto.tenant_id,
        campus_id: dto.campus_id,
        role_id: dto.role_id,
        student_id: dto.student_id,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        status: UserStatus.ACTIVE,
        password_hash: dto.password ? await bcrypt.hash(dto.password, 12) : undefined,
      });
      const saved = await manager.save(User, user);
      delete saved.password_hash;
      return saved;
    }

    if (tenantIdForRls) {
      // Standalone dedicated-connection path (no shared manager) — unchanged from the previous fix.
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      let saved: User;
      try {
        await queryRunner.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantIdForRls]);
        const existing = await queryRunner.manager
          .createQueryBuilder(User, 'user')
          .where('user.tenant_id = :tenantId AND user.email = :email', { tenantId: dto.tenant_id, email: dto.email })
          .getOne();
        if (existing) throw new ConflictException(`Email ${dto.email} already exists for this tenant`);

        const user = queryRunner.manager.create(User, {
          tenant_id: dto.tenant_id,
          campus_id: dto.campus_id,
          role_id: dto.role_id,
          student_id: dto.student_id,
          name: dto.name,
          email: dto.email,
          phone: dto.phone,
          status: UserStatus.ACTIVE,
          password_hash: dto.password ? await bcrypt.hash(dto.password, 12) : undefined,
        });
        saved = await queryRunner.manager.save(User, user);
        await queryRunner.commitTransaction();
      } catch (err) {
        await queryRunner.rollbackTransaction();
        throw err;
      } finally {
        await queryRunner.release();
      }
      delete saved.password_hash;
      return saved;
    }

    // Normal authenticated path — unchanged.
    const existing = await this.repo().findOne({
      where: { tenant_id: dto.tenant_id, email: dto.email },
    });
    if (existing) throw new ConflictException(`Email ${dto.email} already exists for this tenant`);

    if (dto.student_id) {
      const existingLogin = await this.repo().findOne({ where: { student_id: dto.student_id } });
      if (existingLogin) {
        throw new ConflictException('This student already has a login account');
      }
    }

    const user = this.repo().create({
      tenant_id: dto.tenant_id,
      campus_id: dto.campus_id,
      role_id: dto.role_id,
      student_id: dto.student_id,
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      status: UserStatus.ACTIVE,
      password_hash: dto.password ? await bcrypt.hash(dto.password, 12) : undefined,
    });
    const saved = await this.repo().save(user);
    delete saved.password_hash;
    return saved;
  }

  findAllForTenant(tenantId: string): Promise<User[]> {
    return this.repo().find({ where: { tenant_id: tenantId } });
  }

  findByEmailWithPassword(tenantId: string, email: string): Promise<User | null> {
    return this.repo()
      .createQueryBuilder('user')
      .addSelect('user.password_hash')
      .where('user.tenant_id = :tenantId AND user.email = :email', { tenantId, email })
      .getOne();
  }

  /**
   * Platform-level lookup for the subdomain-less Super Admin login path
   * (see SUPER_ADMIN_DASHBOARD_SCOPE.md §4a). Mirrors RolesService.findOne's
   * dedicated-connection pattern rather than going through scopedRepo():
   * this runs during AuthService.login(), before any tenant has been
   * resolved at all — there's no tenant context for TenantContextMiddleware
   * / TenantRlsInterceptor to have set up, unlike the normal
   * findByEmailWithPassword path above, which relies on the middleware
   * having already resolved a real tenant from the request body.
   *
   * The session var is bound as the empty string, not SQL NULL — the RLS
   * policy on `users` (tenant_isolation_users) only matches a NULL-tenant
   * row when current_setting('app.current_tenant_id') is exactly '', never
   * when the GUC is simply unset (confirmed directly against the live
   * policy expression: an unset GUC satisfies neither branch).
   */
  async findPlatformUserByEmailWithPassword(email: string): Promise<User | null> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.query(`SELECT set_config('app.current_tenant_id', '', true)`);
      const user = await queryRunner.manager
        .createQueryBuilder(User, 'user')
        .addSelect('user.password_hash')
        .where('user.tenant_id IS NULL AND user.email = :email', { email })
        .getOne();
      await queryRunner.commitTransaction();
      return user;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findOne(id: string): Promise<User> {
    const user = await this.repo().findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  /**
   * Covers both the "edit info" (name/phone/campus/role) and "mark
   * Inactive" cases from the same endpoint — the frontend's status toggle
   * just sends { status: 'disabled' }, no separate remove/delete route.
   * password_hash is deliberately never editable here — that's a distinct
   * "reset password" concern this DTO doesn't cover.
   */
  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (dto.email && dto.email !== user.email) {
      const existing = await this.repo().findOne({
        where: { tenant_id: user.tenant_id, email: dto.email },
      });
      if (existing) throw new ConflictException(`Email ${dto.email} already exists for this tenant`);
    }

    Object.assign(user, dto);
    const saved = await this.repo().save(user);
    delete saved.password_hash;
    return saved;
  }
}
