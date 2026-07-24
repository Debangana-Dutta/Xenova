import React, { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  FileText,
  Pencil,
  Trash2,
  Upload,
  Loader2,
  CalendarDays,
  Filter,
} from 'lucide-react';
import { productivityApi, getFileUrl } from '../services/api';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

const ACTIVITY_TYPES = ['Workshop', 'Hackathon', 'Certification', 'Sports', 'Volunteering', 'Competition', 'Other'];
const STATUSES = ['planned', 'ongoing', 'completed'];

const STATUS_STYLES = {
  planned: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  ongoing: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  completed: 'bg-sage-600/10 text-sage-700 dark:text-sage-400',
};

const emptyForm = {
  title: '',
  description: '',
  activityType: 'Workshop',
  date: new Date().toISOString().slice(0, 10),
  status: 'planned',
  notes: '',
};

const Activities = () => {
  const toast = useToast();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const { data } = await productivityApi.getActivities();
      setActivities(data.activities);
    } catch (error) {
      toast.error('Could not load your activities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFile(null);
    setModalOpen(true);
  };

  const openEditModal = (activity) => {
    setEditingId(activity._id);
    setForm({
      title: activity.title,
      description: activity.description || '',
      activityType: activity.activityType,
      date: new Date(activity.date).toISOString().slice(0, 10),
      status: activity.status,
      notes: activity.notes || '',
    });
    setFile(null);
    setModalOpen(true);
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e) => {
    setFile(e.target.files?.[0] || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.activityType || !form.date) {
      toast.error('Title, type, and date are required');
      return;
    }

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => formData.append(key, value));
    if (file) formData.append('certificate', file);

    setSubmitting(true);
    try {
      if (editingId) {
        const { data } = await productivityApi.updateActivity(editingId, formData);
        setActivities((prev) => prev.map((a) => (a._id === editingId ? data.activity : a)));
        toast.success('Activity updated');
      } else {
        const { data } = await productivityApi.createActivity(formData);
        setActivities((prev) => [data.activity, ...prev]);
        toast.success('Activity added');
      }
      setModalOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await productivityApi.deleteActivity(deleteTarget._id);
      setActivities((prev) => prev.filter((a) => a._id !== deleteTarget._id));
      toast.success('Activity deleted');
    } catch (error) {
      toast.error('Could not delete activity');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const filtered = useMemo(
    () => (typeFilter ? activities.filter((a) => a.activityType === typeFilter) : activities),
    [activities, typeFilter]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Activities & Streaks
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Keep a record of everything outside the classroom
          </p>
        </div>
        <button onClick={openAddModal} className="btn-primary">
          <Plus size={16} /> Add activity
        </button>
      </div>

      <div className="flex items-center gap-2">
        <Filter size={14} className="text-zinc-400" />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="input w-44 text-sm"
        >
          <option value="">All types</option>
          {ACTIVITY_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card h-40 animate-pulse p-5" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card flex flex-col items-center justify-center gap-2 p-12 text-center">
          <CalendarDays size={28} className="text-zinc-300 dark:text-zinc-700" />
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">No activities yet</p>
          <p className="text-sm text-zinc-400">Log a workshop, hackathon, or achievement to get started.</p>
          <button onClick={openAddModal} className="btn-primary mt-2">
            <Plus size={16} /> Add your first activity
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((a) => (
            <div key={a._id} className="card flex flex-col p-5">
              <div className="mb-2 flex items-start justify-between gap-2">
                <span className={`badge ${STATUS_STYLES[a.status]}`}>{a.status}</span>
                <div className="flex gap-1">
                  <button onClick={() => openEditModal(a)} className="btn-ghost p-1.5" aria-label="Edit activity">
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(a)}
                    className="btn-ghost p-1.5 hover:text-red-500"
                    aria-label="Delete activity"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{a.title}</h3>
              <p className="mt-0.5 text-xs text-zinc-500">
                {a.activityType} · {new Date(a.date).toLocaleDateString()}
              </p>
              {a.description && (
                <p className="mt-2 line-clamp-3 text-sm text-zinc-600 dark:text-zinc-400">
                  {a.description}
                </p>
              )}
              <div className="mt-auto pt-3">
                {a.certificatePath ? (
                  <a
                    href={getFileUrl(a.certificatePath)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-sage-600 hover:underline dark:text-sage-400"
                  >
                    <FileText size={13} /> View certificate
                  </a>
                ) : (
                  <span className="text-xs text-zinc-400">No certificate attached</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit activity' : 'Add activity'}
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="label">Title</label>
            <input name="title" value={form.title} onChange={handleChange} className="input" placeholder="e.g. Regional Hackathon" />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={2}
              className="input resize-none"
              placeholder="What did this involve?"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Type</label>
              <select name="activityType" value={form.activityType} onChange={handleChange} className="input">
                {ACTIVITY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Date</label>
              <input name="date" type="date" value={form.date} onChange={handleChange} className="input" />
            </div>
          </div>

          <div>
            <label className="label">Status</label>
            <select name="status" value={form.status} onChange={handleChange} className="input">
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={2}
              className="input resize-none"
              placeholder="Optional private notes"
            />
          </div>

          <div>
            <label className="label">Certificate (optional)</label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-zinc-300 px-3 py-2.5 text-sm text-zinc-500 hover:border-sage-500 hover:text-sage-600 dark:border-zinc-700">
              <Upload size={16} />
              {file ? file.name : 'Upload PDF, PNG, JPG or WEBP (max 5MB)'}
              <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg,.webp" onChange={handleFileChange} />
            </label>
          </div>

          <div className="flex gap-2 pt-2">
            <button type="submit" className="btn-primary flex-1" disabled={submitting}>
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {editingId ? 'Save changes' : 'Add activity'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete activity?"
        message={`This will permanently remove "${deleteTarget?.title}" and its certificate, if any.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
      />
    </div>
  );
};

export default Activities;
