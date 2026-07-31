import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { RolesModule } from '../roles/roles.module';
import { StudentsModule } from '../students/students.module';
import { TenantsModule } from '../tenants/tenants.module';

@Module({
  imports: [
    PassportModule,
    UsersModule,
    RolesModule,
    StudentsModule,
    // forwardRef() required: TenantsModule imports AuthModule back (for
    // TenantProvisioningGuard's JwtService) — a genuine circular
    // dependency introduced when AuthService started needing
    // TenantsService for subdomain-based login.
    forwardRef(() => TenantsModule),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_ACCESS_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_ACCESS_TTL', '15m') },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  // JwtModule and JwtStrategy exported so TenantContextMiddleware (in AppModule) can decode tokens.
  exports: [JwtModule, AuthService],
})
export class AuthModule {}