import { useState } from 'react'
import { Plus, Shield, CheckCircle } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Modal }      from '../../components/ui/Modal'



import { useUsers, useCreateUser, useUpdateUser } from '../../hooks/useAPI'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'

const ROLE_BADGE = { STOREKEEPER:'badge-blue', SUPERVISOR:'badge-yellow', INSPECTOR:'badge-green', ACCOUNTS:'badge-orange', ADMIN:'badge-primary' }
const ROLE_COLORS = ['from-primary-500 to-violet-600', 'from-cyan-500 to-blue-600', 'from-amber-500 to-orange-600', 'from-emerald-500 to-teal-600', 'from-pink-500 to-rose-600']

export default function UsersPage() {
  const [showAdd, setShowAdd] = useState(false)
  const { data: usersData, isLoading, error } = useUsers()
  const users = usersData?.data || []

  const createUserMutation = useCreateUser()
  const updateUserMutation = useUpdateUser()

  if (isLoading) return <div className="page-root"><LoadingSpinner /></div>
  if (error) return <div className="page-root"><ErrorMessage message={error.message} /></div>

  return (
    <div className="page-root">
      <PageHeader title="User Management" subtitle="System users and role assignments"
        actions={<button className="btn-primary btn-sm" onClick={() => setShowAdd(true)}><Plus size={14} />Add User</button>}
      />
      <div className="table-wrap">
        <table className="table-base">
          <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Status</th><th></th></tr></thead>
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
                    <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                      <CheckCircle size={12} />{u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button className="btn-ghost btn-xs text-zinc-500" onClick={() => {
                       // Temporary simple prompt for demo purposes, could be a full modal
                       const newRole = window.prompt(`Change role for ${u.name} (ADMIN, STOREKEEPER, SUPERVISOR, INSPECTOR, ACCOUNTS):`, u.role);
                       if (newRole && Object.keys(ROLE_BADGE).includes(newRole)) {
                         updateUserMutation.mutate({ id: u.id, data: { role: newRole } });
                       }
                    }}>Edit Role</button>
                    <button className="btn-ghost btn-xs text-red-500" onClick={() => {
                       if (window.confirm(`Are you sure you want to delete ${u.name}?`)) {
                         fetch(`http://localhost:5000/api/data/users/${u.id}`, { method: 'DELETE' }).then(() => window.location.reload());
                       }
                    }}>Delete</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
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
            setShowAdd(false)
          } catch (err) {
            console.error('Failed to create User', err)
          }
        }}>
          <div className="space-y-4">
            <div><label className="label">Full Name</label><input name="name" className="input" required /></div>
            <div><label className="label">Email</label><input name="email" className="input" type="email" required /></div>
            <div><label className="label">Role</label>
              <select name="role" className="input" required>
                <option value="ADMIN">Admin</option>
                <option value="STOREKEEPER">Store Keeper</option>
                <option value="SUPERVISOR">Production Supervisor</option>
                <option value="INSPECTOR">Quality Inspector</option>
                <option value="ACCOUNTS">Accounts</option>
              </select>
            </div>
            <div><label className="label">Temporary Password</label><input name="password" className="input" type="password" required /></div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={createUserMutation.isPending}>Create User</button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  )
}
