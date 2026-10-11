import { useState } from 'react'
import { Plus, Shield, CheckCircle, XCircle, Edit2, Trash2 } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Modal }      from '../../components/ui/Modal'
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '../../hooks/useAPI'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'

const ROLE_BADGE = {
  OWNER: 'badge-purple',
  ADMIN: 'badge-primary',
  STOREKEEPER: 'badge-blue',
  SUPERVISOR: 'badge-yellow',
  INSPECTOR: 'badge-green',
  ACCOUNTS: 'badge-orange',
  BUYER: 'badge-teal',
  WORKER: 'badge-gray',
}

const ROLE_COLORS = [
  'from-primary-500 to-violet-600',
  'from-cyan-500 to-blue-600',
  'from-amber-500 to-orange-600',
  'from-emerald-500 to-teal-600',
  'from-pink-500 to-rose-600'
]

export default function UsersPage() {
  const [showAdd, setShowAdd] = useState(false)
  const [editingUser, setEditingUser] = useState(null)

  const { data: usersData, isLoading, error, refetch: refetchUsers } = useUsers()
  const users = usersData?.data || []

  const createUserMutation = useCreateUser()
  const updateUserMutation = useUpdateUser()
  const deleteUserMutation = useDeleteUser()

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!editingUser) return
    const fd = new FormData(e.target)
    try {
      await updateUserMutation.mutateAsync({
        id: editingUser.id,
        data: {
          name: fd.get('name'),
          email: fd.get('email'),
          role: fd.get('role'),
          isActive: fd.get('isActive') === 'true',
        }
      })
      await refetchUsers()
      setEditingUser(null)
    } catch (err) {
      console.error('Failed to update user:', err)
      alert('Failed to update user: ' + (err?.response?.data?.message || err?.message || err))
    }
  }

  const handleDelete = async (user) => {
    if (window.confirm(`Are you sure you want to remove user "${user.name}"?`)) {
      try {
        await deleteUserMutation.mutateAsync(user.id)
        await refetchUsers()
      } catch (err) {
        console.error('Failed to delete user:', err)
        alert('Failed to delete user: ' + (err?.response?.data?.message || err?.message || err))
      }
    }
  }

  if (isLoading) return <div className="page-root"><LoadingSpinner /></div>
  if (error) return <div className="page-root"><ErrorMessage message={error.message} /></div>

  return (
    <div className="page-root">
      <PageHeader
        title="User Management"
        subtitle="System users, credentials, and role assignments"
        actions={
          <button className="btn-primary btn-sm gap-1.5" onClick={() => setShowAdd(true)}>
            <Plus size={14} />Add User
          </button>
        }
      />

      <div className="table-wrap">
        <table className="table-base">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => {
              const color = ROLE_COLORS[i % ROLE_COLORS.length]
              return (
                <tr key={u.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold text-xs`}>
                        {u.name?.charAt(0) || 'U'}
                      </div>
                      <span className="font-semibold text-zinc-200">{u.name}</span>
                    </div>
                  </td>
                  <td className="font-mono text-xs text-zinc-400">{u.email}</td>
                  <td>
                    <span className={`badge ${ROLE_BADGE[u.role] || 'badge-gray'} capitalize`}>
                      <Shield size={9} />{u.role?.toLowerCase()}
                    </span>
                  </td>
                  <td>
                    <span className={`flex items-center gap-1.5 text-xs font-semibold ${u.isActive ? 'text-emerald-400' : 'text-zinc-500'}`}>
                      {u.isActive ? <CheckCircle size={12} /> : <XCircle size={12} />}
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        className="btn-secondary btn-xs gap-1"
                        onClick={() => setEditingUser(u)}
                      >
                        <Edit2 size={12} />Edit
                      </button>
                      <button
                        className="btn-ghost btn-xs text-red-400 hover:text-red-300 gap-1"
                        onClick={() => handleDelete(u)}
                        disabled={deleteUserMutation.isPending}
                      >
                        <Trash2 size={12} />Delete
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── Add User Modal ── */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add User" description="Create a new ERP user account">
        <form onSubmit={async (e) => {
          e.preventDefault()
          const fd = new FormData(e.target)
          const data = Object.fromEntries(fd.entries())
          try {
            await createUserMutation.mutateAsync({
              name: data.name,
              email: data.email,
              role: data.role,
              password: data.password,
              isActive: true,
            })
            await refetchUsers()
            setShowAdd(false)
          } catch (err) {
            console.error('Failed to create User', err)
            alert('Failed to create user: ' + (err?.response?.data?.message || err?.message || err))
          }
        }}>
          <div className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input name="name" className="input" required placeholder="e.g. Ramesh Kumar" />
            </div>
            <div>
              <label className="label">Email Address</label>
              <input name="email" className="input" type="email" required placeholder="user@textile.com" />
            </div>
            <div>
              <label className="label">Role Assignment</label>
              <select name="role" className="input" required defaultValue="SUPERVISOR">
                <option value="OWNER">Owner / Admin</option>
                <option value="STOREKEEPER">Store Keeper</option>
                <option value="SUPERVISOR">Production Supervisor</option>
                <option value="INSPECTOR">Quality Inspector</option>
                <option value="ACCOUNTS">Accounts</option>
                <option value="BUYER">Buyer</option>
                <option value="WORKER">Worker</option>
              </select>
            </div>
            <div>
              <label className="label">Temporary Password</label>
              <input name="password" className="input" type="password" required defaultValue="textile@123" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={createUserMutation.isPending}>
                {createUserMutation.isPending ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* ── Edit User Modal ── */}
      <Modal
        open={!!editingUser}
        onClose={() => setEditingUser(null)}
        title="Edit User"
        description={editingUser ? `Update profile and permissions for ${editingUser.name}` : ''}
      >
        {editingUser && (
          <form onSubmit={handleEditSubmit}>
            <div className="space-y-4">
              <div>
                <label className="label">Full Name</label>
                <input
                  name="name"
                  className="input"
                  required
                  defaultValue={editingUser.name}
                />
              </div>
              <div>
                <label className="label">Email Address</label>
                <input
                  name="email"
                  className="input"
                  type="email"
                  required
                  defaultValue={editingUser.email}
                />
              </div>
              <div>
                <label className="label">Role Assignment</label>
                <select
                  name="role"
                  className="input"
                  required
                  defaultValue={editingUser.role}
                >
                  <option value="OWNER">Owner / Admin</option>
                  <option value="STOREKEEPER">Store Keeper</option>
                  <option value="SUPERVISOR">Production Supervisor</option>
                  <option value="INSPECTOR">Quality Inspector</option>
                  <option value="ACCOUNTS">Accounts</option>
                  <option value="BUYER">Buyer</option>
                  <option value="WORKER">Worker</option>
                </select>
              </div>
              <div>
                <label className="label">Account Status</label>
                <select
                  name="isActive"
                  className="input"
                  defaultValue={editingUser.isActive ? 'true' : 'false'}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setEditingUser(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={updateUserMutation.isPending}
                >
                  {updateUserMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
