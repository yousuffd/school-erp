'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { SchoolClass, Student } from '@/lib/types';

interface Props {
  students: Student[];
  classes: SchoolClass[];
  value: string;
  onChange: (studentId: string) => void;
  required?: boolean;
}

function classLabel(c: SchoolClass): string {
  return `${c.grade_level}${c.section ? ` - ${c.section}` : ''}`;
}

/**
 * Combobox: a class/grade dropdown narrows the list, and typing filters by
 * name or admission number — replaces a plain <select> that becomes
 * unusable once the school has more than a handful of students (every
 * option rendered flat, no way to search).
 */
export function StudentPicker({ students, classes, value, onChange, required }: Props) {
  const [classFilter, setClassFilter] = useState('');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = students.find((s) => s.id === value);

  // If the parent clears `value` (e.g. after a successful submit resets
  // the form), clear the visible text too rather than leaving a stale name.
  useEffect(() => {
    if (!value) setSearch('');
  }, [value]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students
      .filter((s) => (classFilter ? s.school_class_id === classFilter : true))
      .filter(
        (s) =>
          !q ||
          `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) ||
          s.admission_number.toLowerCase().includes(q),
      )
      .sort((a, b) => a.first_name.localeCompare(b.first_name));
  }, [students, classFilter, search]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelect(s: Student) {
    onChange(s.id);
    setSearch(`${s.first_name} ${s.last_name}`);
    setOpen(false);
  }

  function handleTextChange(text: string) {
    setSearch(text);
    setOpen(true);
    if (value) onChange(''); // typing invalidates whatever was previously picked
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
      <div className="relative">
        <input
          required={required}
          value={selected && !open ? `${selected.first_name} ${selected.last_name} (${selected.admission_number})` : search}
          onChange={(e) => handleTextChange(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Type a student name…"
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
                  onClick={() => handleSelect(s)}
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
