'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { SchoolClass, Student } from '@/lib/types';

interface Props {
  students: Student[];
  classes: SchoolClass[];
  value: string[];
  onChange: (studentIds: string[]) => void;
  excludeStudentIds?: Set<string>;
  required?: boolean;
}

function classLabel(c: SchoolClass): string {
  return `${c.grade_level}${c.section ? ` - ${c.section}` : ''}`;
}

/**
 * Multi-select sibling to StudentPicker — same class-filter + search
 * combobox, but selections accumulate as removable chips instead of
 * replacing a single value. excludeStudentIds hides students who
 * shouldn't be selectable at all (e.g. opted out of transport for the
 * current academic year), same as filtering `students` before passing
 * it in — done here instead so the caller doesn't have to re-derive the
 * filtered list separately for both the chip labels and the dropdown.
 */
export function StudentMultiPicker({ students, classes, value, onChange, excludeStudentIds, required }: Props) {
  const [classFilter, setClassFilter] = useState('');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectable = useMemo(
    () => (excludeStudentIds ? students.filter((s) => !excludeStudentIds.has(s.id)) : students),
    [students, excludeStudentIds],
  );

  const selected = useMemo(
    () => value.map((id) => selectable.find((s) => s.id === id)).filter((s): s is Student => !!s),
    [value, selectable],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return selectable
      .filter((s) => !value.includes(s.id))
      .filter((s) => (classFilter ? s.school_class_id === classFilter : true))
      .filter(
        (s) =>
          !q ||
          `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) ||
          s.admission_number.toLowerCase().includes(q),
      )
      .sort((a, b) => a.first_name.localeCompare(b.first_name));
  }, [selectable, value, classFilter, search]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleAdd(s: Student) {
    onChange([...value, s.id]);
    setSearch('');
  }

  function handleRemove(studentId: string) {
    onChange(value.filter((id) => id !== studentId));
  }

  return (
    <div ref={containerRef} className="space-y-2">
      <select
        value={classFilter}
        onChange={(e) => setClassFilter(e.target.value)}
        className="w-full rounded-button border border-border px-3 py-2 text-body"
      >
        <option value="">All Classes</option>
        {classes.map((c) => (
          <option key={c.id} value={c.id}>
            {classLabel(c)}
          </option>
        ))}
      </select>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((s) => (
            <span
              key={s.id}
              className="flex items-center gap-1 rounded-full bg-canvas px-2.5 py-1 text-caption text-text-primary"
            >
              {s.first_name} {s.last_name}
              <button
                type="button"
                onClick={() => handleRemove(s.id)}
                className="text-text-secondary hover:text-danger"
                aria-label={`Remove ${s.first_name} ${s.last_name}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <input
          required={required && value.length === 0}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={value.length === 0 ? 'Type a student name…' : 'Add another student…'}
          className="w-full rounded-button border border-border px-3 py-2 text-body"
        />
        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary"
        />
        {open && (
          <div className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-button border border-border bg-card shadow-card">
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-caption text-text-secondary">No students match.</p>
            ) : (
              filtered.map((s) => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => handleAdd(s)}
                  className="block w-full px-3 py-2 text-left text-body hover:bg-canvas"
                >
                  {s.first_name} {s.last_name}{' '}
                  <span className="font-mono text-caption text-text-secondary">({s.admission_number})</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
