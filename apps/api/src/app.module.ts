import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { typeOrmConfig } from './config/typeorm.config';
import { TenantContextMiddleware } from './common/middleware/tenant-context.middleware';
import { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { PlatformAdminModule } from './modules/platform-admin/platform-admin.module';
import { BillingModule } from './modules/billing/billing.module';
import { CampusesModule } from './modules/campuses/campuses.module';
import { AcademicYearsModule } from './modules/academic-years/academic-years.module';
import { RolesModule } from './modules/roles/roles.module';
import { UsersModule } from './modules/users/users.module';
import { StudentsModule } from './modules/students/students.module';
import { AdmissionsModule } from './modules/admissions/admissions.module';
import { SubjectsModule } from './modules/subjects/subjects.module';
import { ClassesModule } from './modules/classes/classes.module';
import { TimetableModule } from './modules/timetable/timetable.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { FeesModule } from './modules/fees/fees.module';
import { CommunicationModule } from './modules/communication/communication.module';
import { ExaminationsModule } from './modules/examinations/examinations.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RbacGuard } from './common/guards/rbac.guard';
import { TenantRlsInterceptor } from './common/interceptors/tenant-rls.interceptor';
import { LmsModule } from './modules/lms/lms.module';
import { LibraryModule } from './modules/library/library.module';
import { TransportationModule } from './modules/transportation/transportation.module';
import { HealthWellnessModule } from './modules/health-wellness/health-wellness.module';
import { InventoryAssetsModule } from './modules/inventory-assets/inventory-assets.module';
import { CafeteriaModule } from './modules/cafeteria/cafeteria.module';
import { ActivitiesModule } from './modules/activities/activities.module';
import { DisciplineModule } from './modules/discipline/discipline.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { AlumniModule } from './modules/alumni/alumni.module';
import { FeatureToggleGuard } from './common/guards/feature-toggle.guard';
import { FeatureTogglesModule } from './modules/feature-toggles/feature-toggles.module';
import { HostelModule } from './modules/hostel/hostel.module';
import { HrManagementModule } from './modules/hr-management/hr-management.module';
import { PayrollModule } from './modules/payroll/payroll.module';
import { DiaryModule } from './modules/diary/diary.module';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync(typeOrmConfig),
    AuthModule,
    TenantsModule,
    PlatformAdminModule,
    BillingModule,
    CampusesModule,
    AcademicYearsModule,
    RolesModule,
    UsersModule,
    StudentsModule,
    AdmissionsModule,
    SubjectsModule,
    ClassesModule,
    TimetableModule,
    AttendanceModule,
    FeesModule,
    CommunicationModule,
    ExaminationsModule,
    LmsModule,
    LibraryModule,
    TransportationModule,
    HealthWellnessModule,
    InventoryAssetsModule,
    CafeteriaModule,
    ActivitiesModule,
    DisciplineModule,
    DocumentsModule,
    AlumniModule,
    FeatureTogglesModule,
    HostelModule,
    HrManagementModule,
    PayrollModule,
    DiaryModule,
  ],
  providers: [
    // Global auth guard: every route requires a valid JWT unless marked @Public().
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // Global RBAC guard: checks @Permissions() metadata against the caller's role.
    { provide: APP_GUARD, useClass: RbacGuard },
    // Opens the RLS-scoped transaction for the request (see interceptor for why
    // this needs to run per-request rather than relying on the connection pool).
    { provide: APP_INTERCEPTOR, useClass: TenantRlsInterceptor },
    { provide: APP_GUARD, useClass: FeatureToggleGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Resolves tenant from subdomain/JWT claim once, propagates via AsyncLocalStorage,
    // and sets the Postgres session var used by RLS policies (blueprint 4.3).
    consumer.apply(TenantContextMiddleware).forRoutes('*');
  }
}