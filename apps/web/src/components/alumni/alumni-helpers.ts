import { AlumniProfile, Student } from '@/lib/types';

/** "Priya Sharma — Class of 2020" style label, used everywhere an alumni_id needs a human name. */
export function alumniLabel(profile: AlumniProfile | undefined, students: Student[]): string {
  if (!profile) return 'Unknown alumnus';
  const s = students.find((st) => st.id === profile.student_id);
  const name = s ? `${s.first_name} ${s.last_name}` : profile.student_id;
  return `${name} — Class of ${profile.graduation_year}`;
}