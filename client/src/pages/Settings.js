import React, { useState } from 'react';
import { Loader2, Monitor, Moon, Sun, LogOut, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { authApi } from '../services/api';
import { CURRENCY_SYMBOL, formatCurrency } from '../utils/currency';

// The sidebar previously rendered a Settings button with no onClick handler.
// This page gives it somewhere to go, and — more importantly — is the only
// place a user can set `monthlyBudget`, which the entire budget-tracking
// feature on the Finance page depends on.

const SectionCard = ({ title, description, children }) => (
  <section className="card p-5">
    <div className="mb-4">
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{title}</h2>
      {description && (
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
      )}
    </div>
    {children}
  </section>
);

const FieldError = ({ message }) =>
  message ? (
    <p className="mt-1.5 text-xs text-red-500" role="alert">
      {message}
    </p>
  ) : null;

const THEME_OPTIONS = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

const SettingsPage = () => {
  const { user, updateUser, logout } = useAuth();
  const { preference, setTheme } = useTheme();
  const toast = useToast();

  const [profile, setProfile] = useState({
    name: user?.name || '',
    monthlyBudget: user?.monthlyBudget ?? 0,
  });
  const [profileErrors, setProfileErrors] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [savingPassword, setSavingPassword] = useState(false);

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
    setProfileErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validateProfile = () => {
    const errors = {};
    const trimmedName = profile.name.trim();

    if (!trimmedName) errors.name = 'Enter your name';
    else if (trimmedName.length > 60) errors.name = 'Name cannot exceed 60 characters';

    const budget = Number(profile.monthlyBudget);
    if (profile.monthlyBudget === '' || !Number.isFinite(budget)) {
      errors.monthlyBudget = 'Enter a number';
    } else if (budget < 0) {
      errors.monthlyBudget = 'Budget cannot be negative';
    } else if (budget > 10000000) {
      errors.monthlyBudget = 'Budget looks too large — check the value';
    }

    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    if (savingProfile || !validateProfile()) return;

    setSavingProfile(true);
    try {
      const { data } = await authApi.updateMe({
        name: profile.name.trim(),
        monthlyBudget: Number(profile.monthlyBudget),
      });
      // Sync the auth context so the avatar initials and budget update
      // everywhere without a page reload.
      updateUser(data.user);
      toast.success('Settings saved');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not save your settings');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswords((prev) => ({ ...prev, [name]: value }));
    setPasswordErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validatePasswords = () => {
    const errors = {};
    if (!passwords.currentPassword) errors.currentPassword = 'Enter your current password';
    if (!passwords.newPassword) errors.newPassword = 'Enter a new password';
    else if (passwords.newPassword.length < 6)
      errors.newPassword = 'Use at least 6 characters';
    else if (passwords.newPassword === passwords.currentPassword)
      errors.newPassword = 'New password must differ from the current one';
    if (passwords.confirmPassword !== passwords.newPassword)
      errors.confirmPassword = 'Passwords do not match';

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    if (savingPassword || !validatePasswords()) return;

    setSavingPassword(true);
    try {
      await authApi.changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password changed');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not change your password');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Settings
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Manage your profile, budget and how Xenova looks.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Profile + budget */}
          <SectionCard
            title="Profile and budget"
            description="Your monthly budget drives the budget tracking on the Finance page."
          >
            <form onSubmit={handleProfileSubmit} className="space-y-4" noValidate>
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-sm font-semibold text-amber-600 dark:text-amber-400">
                  {user?.initials || '--'}
                </span>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Your initials update automatically when you change your name.
                </p>
              </div>

              <div>
                <label className="label" htmlFor="settings-name">
                  Full name
                </label>
                <input
                  id="settings-name"
                  name="name"
                  value={profile.name}
                  onChange={handleProfileChange}
                  className="input"
                  maxLength={60}
                  aria-invalid={Boolean(profileErrors.name)}
                />
                <FieldError message={profileErrors.name} />
              </div>

              <div>
                <label className="label" htmlFor="settings-email">
                  Email
                </label>
                <input
                  id="settings-email"
                  value={user?.email || ''}
                  className="input cursor-not-allowed opacity-60"
                  disabled
                  readOnly
                />
                <p className="mt-1.5 text-xs text-zinc-400 dark:text-zinc-500">
                  Email is used to sign in and cannot be changed here.
                </p>
              </div>

              <div>
                <label className="label" htmlFor="settings-budget">
                  Monthly budget
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">
                    {CURRENCY_SYMBOL}
                  </span>
                  <input
                    id="settings-budget"
                    name="monthlyBudget"
                    type="number"
                    min="0"
                    step="1"
                    value={profile.monthlyBudget}
                    onChange={handleProfileChange}
                    className="input pl-7"
                    aria-invalid={Boolean(profileErrors.monthlyBudget)}
                  />
                </div>
                <FieldError message={profileErrors.monthlyBudget} />
                {!profileErrors.monthlyBudget && Number(profile.monthlyBudget) > 0 && (
                  <p className="mt-1.5 text-xs text-zinc-400 dark:text-zinc-500">
                    Tracking against {formatCurrency(profile.monthlyBudget)} per month.
                  </p>
                )}
              </div>

              <button type="submit" className="btn-primary" disabled={savingProfile}>
                {savingProfile && <Loader2 size={16} className="animate-spin" />}
                Save changes
              </button>
            </form>
          </SectionCard>

          {/* Password */}
          <SectionCard
            title="Password"
            description="You'll need your current password to set a new one."
          >
            <form onSubmit={handlePasswordSubmit} className="space-y-4" noValidate>
              <div>
                <label className="label" htmlFor="settings-current-password">
                  Current password
                </label>
                <input
                  id="settings-current-password"
                  name="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  value={passwords.currentPassword}
                  onChange={handlePasswordChange}
                  className="input"
                  aria-invalid={Boolean(passwordErrors.currentPassword)}
                />
                <FieldError message={passwordErrors.currentPassword} />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="settings-new-password">
                    New password
                  </label>
                  <input
                    id="settings-new-password"
                    name="newPassword"
                    type="password"
                    autoComplete="new-password"
                    value={passwords.newPassword}
                    onChange={handlePasswordChange}
                    className="input"
                    aria-invalid={Boolean(passwordErrors.newPassword)}
                  />
                  <FieldError message={passwordErrors.newPassword} />
                </div>
                <div>
                  <label className="label" htmlFor="settings-confirm-password">
                    Confirm new password
                  </label>
                  <input
                    id="settings-confirm-password"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    value={passwords.confirmPassword}
                    onChange={handlePasswordChange}
                    className="input"
                    aria-invalid={Boolean(passwordErrors.confirmPassword)}
                  />
                  <FieldError message={passwordErrors.confirmPassword} />
                </div>
              </div>

              <button type="submit" className="btn-secondary" disabled={savingPassword}>
                {savingPassword && <Loader2 size={16} className="animate-spin" />}
                Change password
              </button>
            </form>
          </SectionCard>
        </div>

        <div className="space-y-6">
          {/* Appearance */}
          <SectionCard title="Appearance" description="System follows your device setting.">
            <div className="space-y-1.5" role="radiogroup" aria-label="Theme">
              {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
                const active = preference === value;
                return (
                  <button
                    key={value}
                    role="radio"
                    aria-checked={active}
                    onClick={() => setTheme(value)}
                    className={`flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 ${
                      active
                        ? 'border-sage-600/30 bg-sage-600/10 text-sage-700 dark:text-sage-400'
                        : 'border-transparent text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/70'
                    }`}
                  >
                    <Icon size={16} />
                    {label}
                    {active && <Check size={15} className="ml-auto" />}
                  </button>
                );
              })}
            </div>
          </SectionCard>

          {/* Currency */}
          <SectionCard title="Currency">
            <div className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2.5 dark:bg-zinc-800/50">
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Indian Rupee
              </span>
              <span className="badge bg-sage-600/10 text-sage-700 dark:text-sage-400">
                {CURRENCY_SYMBOL} INR
              </span>
            </div>
            <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
              All amounts are stored as plain numbers, so adding more currencies later only
              means extending the formatter.
            </p>
          </SectionCard>

          {/* Session */}
          <SectionCard title="Session">
            <button onClick={logout} className="btn-danger w-full">
              <LogOut size={16} />
              Log out
            </button>
          </SectionCard>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
