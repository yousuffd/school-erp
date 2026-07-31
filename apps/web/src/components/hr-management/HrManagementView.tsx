'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { RecruitmentSection } from './RecruitmentSection';
import { EmployeesSection } from './EmployeesSection';
import { LeaveRequestsSection } from './LeaveRequestsSection';
import { AttendanceSection } from './AttendanceSection';
import { PerformanceReviewsSection } from './PerformanceReviewsSection';
import { CertificationsSection } from './CertificationsSection';
import { SuccessionPlansSection } from './SuccessionPlansSection';

interface Props {
  tenantId: string;
}

type Tab = 'recruitment' | 'employees' | 'leave' | 'attendance' | 'reviews' | 'certifications' | 'succession';

const TABS: { key: Tab; label: string }[] = [
  { key: 'recruitment', label: 'Recruitment' },
  { key: 'employees', label: 'Employees' },
  { key: 'leave', label: 'Leave Requests' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'reviews', label: 'Performance Reviews' },
  { key: 'certifications', label: 'Certifications' },
  { key: 'succession', label: 'Succession Planning' },
];

export function HrManagementView({ tenantId }: Props) {
  const [tab, setTab] = useState<Tab>('recruitment');

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={clsx(
              'border-b-2 px-4 py-2.5 text-body font-medium transition-colors',
              tab === t.key
                ? 'border-accent text-accent'
                : 'border-transparent text-text-secondary hover:text-text-primary',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'recruitment' && <RecruitmentSection tenantId={tenantId} />}
      {tab === 'employees' && <EmployeesSection tenantId={tenantId} />}
      {tab === 'leave' && <LeaveRequestsSection tenantId={tenantId} />}
      {tab === 'attendance' && <AttendanceSection tenantId={tenantId} />}
      {tab === 'reviews' && <PerformanceReviewsSection tenantId={tenantId} />}
      {tab === 'certifications' && <CertificationsSection tenantId={tenantId} />}
      {tab === 'succession' && <SuccessionPlansSection tenantId={tenantId} />}
    </div>
  );
}