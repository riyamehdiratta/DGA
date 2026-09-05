import { useEffect, useState } from 'react';
import { createUser, fetchUsers, resetUserPassword, updateUser } from '@/api/admin';
import { ApiError } from '@/api/client';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/ui/DataTable';
import { FormField, TextInput } from '@/components/ui/FormField';
import { useAuth } from '@/context';
import type { AuthUser, UserRole } from '@/types';

export function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [managingUserId, setManagingUserId] = useState<string | null>(null);

  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('ENGINEER');
  const [creating, setCreating] = useState(false);

  function load() {
    fetchUsers()
      .then(setUsers)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load users'));
  }

  useEffect(load, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreating(true);
    try {
      const user = await createUser({ email: newEmail, password: newPassword, role: newRole });
      setUsers((prev) => [...prev, user]);
      setNewEmail('');
      setNewPassword('');
      setNewRole('ENGINEER');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create user');
    } finally {
      setCreating(false);
    }
  }

  const managingUser = users.find((u) => u.id === managingUserId) ?? null;

  return (
    <div>
      <PageHeader title="User Management" description="Create, edit, disable, and reset passwords for accounts." />

      {error && <p className="mb-4 text-sm text-red-700">{error}</p>}

      <Card title="Create User" className="mb-6">
        <form className="flex flex-wrap items-end gap-4" onSubmit={handleCreate}>
          <FormField label="Email" htmlFor="new-user-email">
            <TextInput
              id="new-user-email"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
            />
          </FormField>
          <FormField label="Password" htmlFor="new-user-password">
            <TextInput
              id="new-user-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
            />
          </FormField>
          <FormField label="Role" htmlFor="new-user-role">
            <select
              id="new-user-role"
              className="px-3 py-2 text-sm"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as UserRole)}
            >
              <option value="ENGINEER">Engineer</option>
              <option value="ADMIN">Admin</option>
            </select>
          </FormField>
          <Button type="submit" disabled={creating}>
            {creating ? 'Creating...' : 'Create User'}
          </Button>
        </form>
      </Card>

      <DataTable
        columns={[
          { key: 'email', header: 'Email', render: (u) => u.email },
          { key: 'role', header: 'Role', render: (u) => u.role },
          {
            key: 'status',
            header: 'Status',
            render: (u) => (u.isActive ? 'Active' : 'Disabled'),
          },
          {
            key: 'createdAt',
            header: 'Created',
            render: (u) => new Date(u.createdAt).toLocaleDateString(),
          },
          {
            key: 'actions',
            header: '',
            render: (u) => (
              <button
                type="button"
                className="cursor-pointer text-xs text-gray-600 underline hover:text-gray-900"
                onClick={() => setManagingUserId(u.id === managingUserId ? null : u.id)}
              >
                Manage
              </button>
            ),
          },
        ]}
        data={users}
        getRowKey={(u) => u.id}
        emptyMessage="No users yet."
      />

      {managingUser && (
        <ManageUserPanel
          user={managingUser}
          isSelf={managingUser.id === currentUser.id}
          onUpdated={(updated) => {
            setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
          }}
          onClose={() => setManagingUserId(null)}
        />
      )}
    </div>
  );
}

function ManageUserPanel({
  user,
  isSelf,
  onUpdated,
  onClose,
}: {
  user: AuthUser;
  isSelf: boolean;
  onUpdated: (user: AuthUser) => void;
  onClose: () => void;
}) {
  const [role, setRole] = useState<UserRole>(user.role);
  const [isActive, setIsActive] = useState(user.isActive);
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  async function handleSave() {
    setError(null);
    setSaving(true);
    try {
      const updated = await updateUser(user.id, { role, isActive });
      onUpdated(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update user');
    } finally {
      setSaving(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResetting(true);
    try {
      await resetUserPassword(user.id, newPassword);
      setNewPassword('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to reset password');
    } finally {
      setResetting(false);
    }
  }

  return (
    <Card title={`Manage ${user.email}`} className="mt-6" action={
      <button type="button" className="cursor-pointer text-xs text-gray-500 underline" onClick={onClose}>
        Close
      </button>
    }>
      {error && <p className="mb-3 text-sm text-red-700">{error}</p>}
      {isSelf && (
        <p className="mb-3 text-xs text-gray-500">
          You cannot disable or demote your own account.
        </p>
      )}

      <div className="mb-4 flex flex-wrap items-end gap-4">
        <FormField label="Role" htmlFor="edit-role">
          <select
            id="edit-role"
            className="px-3 py-2 text-sm"
            value={role}
            disabled={isSelf}
            onChange={(e) => setRole(e.target.value as UserRole)}
          >
            <option value="ENGINEER">Engineer</option>
            <option value="ADMIN">Admin</option>
          </select>
        </FormField>
        <label className="flex items-center gap-2 pb-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={isActive}
            disabled={isSelf}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          Active
        </label>
        <Button type="button" onClick={() => void handleSave()} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>

      <form className="flex flex-wrap items-end gap-4 border-t border-gray-200 pt-4" onSubmit={handleResetPassword}>
        <FormField label="Reset Password" htmlFor="reset-password">
          <TextInput
            id="reset-password"
            type="password"
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </FormField>
        <Button type="submit" variant="secondary" disabled={resetting}>
          {resetting ? 'Resetting...' : 'Reset Password'}
        </Button>
      </form>
    </Card>
  );
}
