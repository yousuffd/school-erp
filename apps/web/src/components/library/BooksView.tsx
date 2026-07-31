'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Plus, BookOpen } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api, ApiError } from '@/lib/api';
import { BookCopy, BookCopyStatus, BookWithAvailability, Campus } from '@/lib/types';

interface Props {
  tenantId: string;
}

const COPY_STATUS_TONE: Record<BookCopyStatus, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  available: 'success',
  issued: 'info',
  reserved: 'warning',
  lost: 'danger',
  under_repair: 'neutral',
};

const COPY_STATUS_LABEL: Record<BookCopyStatus, string> = {
  available: 'Available',
  issued: 'Issued',
  reserved: 'Reserved',
  lost: 'Lost',
  under_repair: 'Under Repair',
};

export function BooksView({ tenantId }: Props) {
  const [books, setBooks] = useState<BookWithAvailability[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterTitle, setFilterTitle] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('');
  const [isbn, setIsbn] = useState('');
  const [publisher, setPublisher] = useState('');

  const [selectedBookId, setSelectedBookId] = useState('');
  const [copies, setCopies] = useState<BookCopy[]>([]);
  const [showCopyForm, setShowCopyForm] = useState(false);
  const [newBarcode, setNewBarcode] = useState('');
  const [newCopyCampusId, setNewCopyCampusId] = useState('');
  const [savingCopy, setSavingCopy] = useState(false);

  function load() {
    setLoading(true);
    Promise.all([api.getBooks(tenantId, {}), api.getCampuses(tenantId)])
      .then(([b, c]) => {
        setBooks(b);
        setCampuses(c);
        setNewCopyCampusId((prev) => prev || c[0]?.id || '');
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }

  useEffect(load, [tenantId]);

  function resetBookForm() {
    setShowForm(false);
    setTitle('');
    setAuthor('');
    setCategory('');
    setIsbn('');
    setPublisher('');
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.createBook({
        tenant_id: tenantId,
        title,
        author,
        category: category || undefined,
        isbn: isbn || undefined,
        publisher: publisher || undefined,
      });
      resetBookForm();
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create book');
    } finally {
      setSaving(false);
    }
  }

  async function handleSelectBook(book: BookWithAvailability) {
    setSelectedBookId(book.id);
    setShowCopyForm(false);
    try {
      const c = await api.getBookCopies(book.id);
      setCopies(c);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load copies');
    }
  }

  function resetCopyForm() {
    setNewBarcode('');
    setShowCopyForm(false);
  }

  async function handleAddCopy(e: FormEvent) {
    e.preventDefault();
    setSavingCopy(true);
    setError(null);
    try {
      await api.addBookCopy(selectedBookId, {
        tenant_id: tenantId,
        book_id: selectedBookId,
        campus_id: newCopyCampusId,
        barcode: newBarcode,
      });
      resetCopyForm();
      const c = await api.getBookCopies(selectedBookId);
      setCopies(c);
      load(); // refresh availability counts in the table above
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to add copy');
    } finally {
      setSavingCopy(false);
    }
  }

  async function handleUpdateCopyStatus(copyId: string, status: BookCopyStatus) {
    setError(null);
    try {
      await api.updateBookCopyStatus(copyId, status);
      const c = await api.getBookCopies(selectedBookId);
      setCopies(c);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update copy status');
    }
  }

  const filteredBooks = useMemo(
    () =>
      books
        .filter((b) => (filterTitle ? b.title.toLowerCase().includes(filterTitle.toLowerCase()) : true))
        .filter((b) => (filterCategory ? b.category === filterCategory : true))
        .sort((a, b) => a.title.localeCompare(b.title)),
    [books, filterTitle, filterCategory],
  );

  const categories = useMemo(
    () => Array.from(new Set(books.map((b) => b.category).filter((c): c is string => !!c))),
    [books],
  );

  const selectedBook = books.find((b) => b.id === selectedBookId);

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">{error}</div>
      )}

      <Card
        title="Book Catalog"
        action={
          <Button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-1.5">
            <Plus size={16} /> Add Book
          </Button>
        }
      >
        {showForm && (
          <form
            onSubmit={handleCreate}
            className="mb-5 grid grid-cols-1 gap-4 rounded-card border border-border bg-canvas p-4 sm:grid-cols-3"
          >
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Title</label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              />
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Author</label>
              <input
                required
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              />
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Category</label>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Fiction, Non-Fiction…"
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              />
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">ISBN</label>
              <input
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                className="w-full rounded-button border border-border px-3 py-2 font-mono text-body"
              />
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Publisher</label>
              <input
                value={publisher}
                onChange={(e) => setPublisher(e.target.value)}
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              />
            </div>
            <div className="flex gap-2 sm:col-span-3">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Add Book'}
              </Button>
              <Button type="button" variant="secondary" onClick={resetBookForm} disabled={saving}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            value={filterTitle}
            onChange={(e) => setFilterTitle(e.target.value)}
            placeholder="Search by title…"
            className="rounded-button border border-border px-3 py-2 text-body"
          />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded-button border border-border px-3 py-2 text-body"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
        ) : filteredBooks.length === 0 ? (
          <p className="py-6 text-center text-body text-text-secondary">No books yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-card border border-border">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-canvas text-caption text-text-secondary">
                  <th className="py-2 px-3 font-medium">Title</th>
                  <th className="py-2 px-3 font-medium">Author</th>
                  <th className="py-2 px-3 font-medium">Category</th>
                  <th className="py-2 px-3 font-medium">Copies</th>
                </tr>
              </thead>
              <tbody>
                {filteredBooks.map((b) => (
                  <tr
                    key={b.id}
                    onClick={() => handleSelectBook(b)}
                    className={
                      selectedBookId === b.id
                        ? 'cursor-pointer border-b border-border bg-accent-light last:border-0'
                        : 'cursor-pointer border-b border-border last:border-0 hover:bg-canvas'
                    }
                  >
                    <td className="py-2 px-3 text-body font-medium text-text-primary">{b.title}</td>
                    <td className="py-2 px-3 text-body text-text-primary">{b.author}</td>
                    <td className="py-2 px-3 text-body text-text-secondary">{b.category ?? '—'}</td>
                    <td className="py-2 px-3">
                      <Badge tone={b.available_copies > 0 ? 'success' : 'danger'}>
                        {b.available_copies}/{b.total_copies} available
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {selectedBook && (
        <Card
          title={`Copies — ${selectedBook.title}`}
          action={
            <Button
              variant="secondary"
              onClick={() => setShowCopyForm((s) => !s)}
              className="flex items-center gap-1.5"
            >
              <Plus size={16} /> Add Copy
            </Button>
          }
        >
          {showCopyForm && (
            <form
              onSubmit={handleAddCopy}
              className="mb-5 grid grid-cols-1 gap-4 rounded-card border border-border bg-canvas p-4 sm:grid-cols-3"
            >
              <div>
                <label className="mb-1 block text-caption text-text-secondary">Barcode</label>
                <input
                  required
                  value={newBarcode}
                  onChange={(e) => setNewBarcode(e.target.value)}
                  placeholder="LIB-1234"
                  className="w-full rounded-button border border-border px-3 py-2 font-mono text-body"
                />
              </div>
              <div>
                <label className="mb-1 block text-caption text-text-secondary">Campus</label>
                <select
                  required
                  value={newCopyCampusId}
                  onChange={(e) => setNewCopyCampusId(e.target.value)}
                  className="w-full rounded-button border border-border px-3 py-2 text-body"
                >
                  {campuses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end gap-2">
                <Button type="submit" disabled={savingCopy}>
                  {savingCopy ? 'Saving…' : 'Add Copy'}
                </Button>
                <Button type="button" variant="secondary" onClick={resetCopyForm} disabled={savingCopy}>
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {copies.length === 0 ? (
            <p className="py-6 text-center text-body text-text-secondary">No copies yet.</p>
          ) : (
            <div className="space-y-2">
              {copies.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-card border border-border p-3">
                  <div className="flex items-center gap-3">
                    <BookOpen size={16} className="text-accent" />
                    <span className="font-mono text-body text-text-primary">{c.barcode}</span>
                    <Badge tone={COPY_STATUS_TONE[c.status]}>{COPY_STATUS_LABEL[c.status]}</Badge>
                  </div>
                  <div className="flex gap-3">
                    {c.status === 'available' && (
                      <button
                        onClick={() => handleUpdateCopyStatus(c.id, 'lost')}
                        className="text-caption font-medium text-danger hover:underline"
                      >
                        Mark Lost
                      </button>
                    )}
                    {(c.status === 'lost' || c.status === 'under_repair') && (
                      <button
                        onClick={() => handleUpdateCopyStatus(c.id, 'available')}
                        className="text-caption font-medium text-accent hover:underline"
                      >
                        Mark Available
                      </button>
                    )}
                    {/* issued/reserved copies deliberately have no direct-edit action here —
                        those transitions only happen through the Issue/Return workflow,
                        matching the server-side guard in BooksService.updateCopyStatus. */}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
