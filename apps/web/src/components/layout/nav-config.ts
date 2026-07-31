import {
  LayoutDashboard,
  Users,
  ClipboardList,
  CalendarCheck,
  BookOpen,
  FileCheck2,
  ListTodo,
  ShieldAlert,
  Wallet,
  Bus,
  Library,
  HeartPulse,
  Boxes,
  UtensilsCrossed,
  BedDouble,
  Briefcase,
  Contact,
  DollarSign,
  Languages,
  ShieldCheck,
  FileText,
  MessageSquare,
  BarChart3,
  Settings,
  LucideIcon,
  Trophy,
  GraduationCap,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Phase this module ships in — shown as a "Ph.N" tag when not yet enabled. */
  phase: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** Whether this screen actually exists yet — independent of `phase` so we
   *  can flip individual items on as they're built without relabeling them. */
  enabled: boolean;
  /**
   * Section header rendered above the first visible item of each group.
   * Grouping mirrors the blueprint's own module taxonomy (Part 2, A–M
   * categories) rather than build order, which is how items were
   * previously (accidentally) ordered — each phase just appended new
   * modules to the end, leaving Settings stranded mid-list and later
   * phases' core modules trailing after it. Sidebar.tsx renders a header
   * whenever an item's group differs from the previous VISIBLE item's
   * group (not the previous item in this raw array), so a group with
   * zero items visible to the current user's permissions never produces
   * an empty header.
   */
  group: 'Overview' | 'Student & Academics' | 'Finance & People' | 'Campus Operations' | 'Engagement & Records' | 'Platform';
  /**
   * The backend @Permissions() module key this item is gated by — checked
   * via hasPermission(user, permissionModule, 'view') in Sidebar.tsx. This
   * is what makes nav visibility correctly reflect CUSTOM roles an Admin
   * creates, not just the built-in ones — a hardcoded role-name list can
   * never know about a role invented after the list was written.
   *
   * Left undefined for items that are NOT permission-gated at all:
   *   - Dashboard: always visible to any authenticated user.
   *   - My HR / Provision New Tenant: genuine role-CATEGORY checks, not
   *     module permissions — see Sidebar.tsx's special-cased handling and
   *     lib/roles.ts's doc comment for why these stay role-based.
   *   - Items with enabled:false: not yet built, no real permission key
   *     exists for them yet either (Behaviour & Remarks, Documents, Reports)
   *     — shown to everyone as a "coming in Phase N" placeholder, same as
   *     today; not a security-relevant distinction, so no gate needed.
   */
  permissionModule?: string;
}

/**
 * Full product nav per DESIGN_SYSTEM.md §1, so the shell reads as the real
 * product (kickoff §5 acceptance criterion: "not a generic admin template"),
 * not a stub. Disabled items render with a phase tag, per kickoff §1 ("do
 * not build ahead of the roadmap").
 *
 * Reordered and grouped (see NavItem.group doc comment) to match the
 * blueprint's Part 2 module taxonomy instead of build order — Settings
 * moved from mid-list to the very end, per the universal convention that
 * platform config sits last.
 */
export const NAV_ITEMS: NavItem[] = [
  // Overview
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, phase: 0, enabled: true, group: 'Overview' },

  // Student & Academics
  { label: 'Student Directory', href: '/students', icon: Users, phase: 1, enabled: true, group: 'Student & Academics', permissionModule: 'student-lifecycle' },
  { label: 'Admission', href: '/admissions', icon: ClipboardList, phase: 1, enabled: true, group: 'Student & Academics', permissionModule: 'admissions' },
  { label: 'Academics', href: '/academics/subjects', icon: BookOpen, phase: 1, enabled: true, group: 'Student & Academics', permissionModule: 'academic-management' },
  { label: 'My Electives', href: '/my-electives', icon: Languages, phase: 4, enabled: true, group: 'Student & Academics' },
  { label: 'Attendance', href: '/attendance', icon: CalendarCheck, phase: 1, enabled: true, group: 'Student & Academics', permissionModule: 'attendance' },
  { label: 'Examinations', href: '/examinations', icon: FileCheck2, phase: 2, enabled: true, group: 'Student & Academics', permissionModule: 'examinations' },
  { label: 'Assignments', href: '/assignments', icon: ListTodo, phase: 2, enabled: true, group: 'Student & Academics', permissionModule: 'lms' },
  { label: 'Behaviour & Discipline', href: '/discipline', icon: ShieldAlert, phase: 5, enabled: true, group: 'Student & Academics', permissionModule: 'discipline' },

  // Finance & People
  { label: 'Fees & Payments', href: '/fees', icon: Wallet, phase: 1, enabled: true, group: 'Finance & People', permissionModule: 'fee-management' },
  { label: 'Payroll', href: '/payroll', icon: DollarSign, phase: 4, enabled: true, group: 'Finance & People', permissionModule: 'payroll' },
  { label: 'HR Management', href: '/hr-management', icon: Briefcase, phase: 4, enabled: true, group: 'Finance & People', permissionModule: 'hr-management' },
  { label: 'My HR', href: '/my-hr', icon: Contact, phase: 4, enabled: true, group: 'Finance & People' },

  // Campus Operations
  { label: 'Transport', href: '/transportation', icon: Bus, phase: 3, enabled: true, group: 'Campus Operations', permissionModule: 'transportation' },
  { label: 'Library', href: '/library/books', icon: Library, phase: 3, enabled: true, group: 'Campus Operations', permissionModule: 'library' },
  { label: 'Hostel', href: '/hostel', icon: BedDouble, phase: 3, enabled: true, group: 'Campus Operations', permissionModule: 'hostel' },
  { label: 'Inventory & Assets', href: '/inventory-assets', icon: Boxes, phase: 3, enabled: true, group: 'Campus Operations', permissionModule: 'inventory-assets' },
  { label: 'Cafeteria', href: '/cafeteria', icon: UtensilsCrossed, phase: 3, enabled: true, group: 'Campus Operations', permissionModule: 'cafeteria' },
  { label: 'Health & Wellness', href: '/health-wellness', icon: HeartPulse, phase: 3, enabled: true, group: 'Campus Operations', permissionModule: 'health-wellness' },

  // Engagement & Records
  { label: 'Communication', href: '/communication', icon: MessageSquare, phase: 1, enabled: true, group: 'Engagement & Records', permissionModule: 'communication' },
  { label: 'Diary', href: '/diary', icon: BookOpen, phase: 1, enabled: true, group: 'Engagement & Records' },
  { label: 'Activities & Events', href: '/activities', icon: Trophy, phase: 5, enabled: true, group: 'Engagement & Records', permissionModule: 'activities' },
  { label: 'Alumni & Advancement', href: '/alumni', icon: GraduationCap, phase: 5, enabled: true, group: 'Engagement & Records', permissionModule: 'alumni' },
  { label: 'Documents', href: '/documents', icon: FileText, phase: 5, enabled: true, group: 'Engagement & Records', permissionModule: 'documents' },

  // Platform
  { label: 'Settings', href: '/admin/academic-years', icon: Settings, phase: 0, enabled: true, group: 'Platform', permissionModule: 'core-admin' },
  { label: 'Provision New Tenant', href: '/provision-tenant', icon: ShieldCheck, phase: 0, enabled: true, group: 'Platform' },
];
