import { useState, useEffect } from 'react'
import {
  Plus, Shield, CheckCircle, AlertTriangle, UserX,
  Edit3, Trash2, UserCheck, ShieldAlert, Settings, Key
} from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Modal }      from '../../components/ui/Modal'
import { useToast }   from '../../components/ui/Toast'
import { cn }         from '../../lib/utils'
import {
  getStoredUsers,
  addStoredUser,
  updateStoredUser,
  removeOrDeactivateUser,
  getSupervisorCanMarkSupervisor,
  setSupervisorCanMarkSupervisor,
} from '../../services/hrStorage'

const ROLE_BADGE = {
  owner:      'badge-primary',
  store:      'badge-blue',
  supervisor: 'badge-yellow',
  inspector:  'badge-green',
  accounts:   'badge-orange',
}

const ROLE_COLORS = {
  owner:      'from-primary-500 to-violet-600',
  store:      'from-cyan-500 to-blue-600',
  supervisor: 'from-amber-500 to-orange-600',
  inspector:  'from-emerald-500 to-teal-600',
  accounts:   'from-pink-500 to-rose-600',
}

/* ── Add User Modal ─────────────────────────────────────────────────── */
function AddUserModal({ open, onClose, onSaved }) {
  const toast = useToast()
  const [form, setForm] = useState({
    name:       '',
    email:      '',
    role:       'supervisor',
    department: 'Production',
    password:   'demo123',
    phone:      '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg]         = useState('')

  useEffect(() => {
    if (open) {
      setForm({
        name:       '',
        email:      '',
        role:       'supervisor',
        department: 'Production',
        password:   'demo123',
        phone:      '',
      })
      setErrorMsg('')
    }
  }, [open])

  const handleRoleChange = (newRole) => {
    let dept = form.department
    if (newRole === 'supervisor' || newRole === 'owner') dept = 'Production'
    if (newRole === 'store') dept = 'Store'
    if (newRole === 'inspector') dept = 'QC'
    if (newRole === 'accounts') dept = 'Accounts'
    setForm(p => ({ ...p, role: newRole, department: dept }))
  }

  const handleNameBlur = () => {
    if (form.name && !form.email) {
      const first = form.name.trim().split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '')
      setForm(p => ({ ...p, email: `${first}@everest.com` }))
    }
  }

  const handleSubmit = () => {
    setErrorMsg('')
    if (!form.name.trim()) {
      setErrorMsg('Full Name is required')
      return
    }
    if (!form.email.trim()) {
      setErrorMsg('Email address is required')
      return
    }

    setIsSubmitting(true)
    try {
      const created = addStoredUser({
        name:       form.name.trim(),
        email:      form.email.trim().toLowerCase(),
        role:       form.role,
        department: form.department,
        phone:      form.phone.trim(),
      })

      toast(`User ${created.name} (${created.role}) created successfully`, 'success')
      onSaved?.(created)
      onClose()
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create user')
      toast(err.message || 'Failed to create user', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add ERP User Account"
      description="Create a new login user and assign operational role permissions"
      size="md"
    >
      <div className="space-y-4">
        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
            <AlertTriangle size={14} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div>
          <label className="label">Full Name <span className="text-red-400">*</span></label>
          <input
            className="input"
            placeholder="e.g. Anand Sharma"
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            onBlur={handleNameBlur}
          />
        </div>

        <div>
          <label className="label">Email Address <span className="text-red-400">*</span></label>
          <input
            className="input font-mono text-xs"
            type="email"
            placeholder="user@everest.com"
            value={form.email}
            onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Role Assignment <span className="text-red-400">*</span></label>
            <select
              className="input capitalize"
              value={form.role}
              onChange={e => handleRoleChange(e.target.value)}
            >
              <option value="owner">Admin</option>
              <option value="supervisor">Production Supervisor</option>
              <option value="inspector">Quality Inspector</option>
              <option value="store">Store Keeper</option>
              <option value="accounts">Accounts & Finance</option>
            </select>
          </div>

          <div>
            <label className="label">Department</label>
            <input
              className="input"
              value={form.department}
              onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <label className="label">Phone Number (Optional)</label>
          <input
            className="input font-mono text-xs"
            placeholder="+91 98XXX XXXXX"
            value={form.phone}
            onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
          />
        </div>

        <div>
          <label className="label">Temporary Password</label>
          <input
            className="input font-mono text-xs"
            type="password"
            value={form.password}
            onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
          />
          <p className="text-2xs text-zinc-500 mt-1">Default demo password: demo123</p>
        </div>

        {form.role === 'supervisor' && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl text-xs text-amber-300 space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              <ShieldAlert size={14} /> Supervisor Sync
            </p>
            <p className="text-2xs text-zinc-400">
              Adding a Production Supervisor user will automatically create and sync an employee record in the Workers & Attendance system.
            </p>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleSubmit}
            disabled={isSubmitting || !form.name.trim() || !form.email.trim()}
          >
            {isSubmitting ? 'Creating…' : 'Create User'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

/* ── Edit User Modal ────────────────────────────────────────────────── */
function EditUserModal({ open, onClose, user, onSaved }) {
  const toast = useToast()
  const [form, setForm] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (user) {
      setForm({
        name:       user.name || '',
        email:      user.email || '',
        role:       user.role || 'supervisor',
        department: user.department || 'Production',
        isActive:   user.isActive !== false,
      })
    }
  }, [user])

  if (!user || !form) return null

  const handleUpdate = () => {
    if (!form.name.trim()) {
      toast('Name is required', 'error')
      return
    }

    setIsSubmitting(true)
    try {
      const updated = updateStoredUser(user.id || user.email, {
        name:       form.name.trim(),
        role:       form.role,
        department: form.department,
        isActive:   form.isActive,
      })

      toast(`User ${updated.name} updated`, 'success')
      onSaved?.(updated)
      onClose()
    } catch (err) {
      toast(err.message || 'Failed to update user', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Edit User — ${user.name}`}
      description="Update user name, role permissions, or department"
      size="md"
    >
      <div className="space-y-4">
        <div>
          <label className="label">Full Name</label>
          <input
            className="input"
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
          />
        </div>

        <div>
          <label className="label">Email Address (Read-only)</label>
          <input
            className="input font-mono text-xs bg-zinc-800/40 text-zinc-400 cursor-not-allowed"
            value={user.email}
            disabled
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Role</label>
            <select
              className="input capitalize"
              value={form.role}
              onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
            >
              <option value="owner">Admin</option>
              <option value="supervisor">Supervisor</option>
              <option value="inspector">Quality Inspector</option>
              <option value="store">Store Keeper</option>
              <option value="accounts">Accounts</option>
            </select>
          </div>

          <div>
            <label className="label">Department</label>
            <input
              className="input"
              value={form.department}
              onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <label className="label">Status</label>
          <label className="flex items-center gap-2.5 p-3 rounded-xl bg-zinc-800/40 border border-zinc-700/60 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))}
              className="checkbox"
            />
            <div>
              <p className="text-xs font-semibold text-zinc-200">Active Account</p>
              <p className="text-2xs text-zinc-500">Uncheck to revoke login and active permissions safely</p>
            </div>
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn-primary" onClick={handleUpdate} disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

/* ── Deactivate User Modal ──────────────────────────────────────────── */
function DeactivateUserModal({ open, onClose, user, onDone }) {
  const toast = useToast()
  const [isDeleting, setIsDeleting] = useState(false)

  if (!user) return null

  const handleConfirm = () => {
    setIsDeleting(true)
    try {
      const res = removeOrDeactivateUser(user.id || user.email)
      toast(res.message, 'info')
      onDone?.(user.id || user.email)
      onClose()
    } catch (err) {
      toast(err.message || 'Failed to deactivate user', 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Deactivate User Account"
      description="Manage user deactivation and permission revocation"
      size="md"
    >
      <div className="space-y-4">
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={18} />
          <div className="space-y-1 text-xs text-zinc-300">
            <p className="font-semibold text-amber-300">Deactivating account: {user.name} ({user.email})</p>
            <p className="text-zinc-400">
              This will deactivate the user's login access. Their historical records, logs, and activity audit trails will be fully preserved in the database.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="btn-danger gap-1.5"
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            <Trash2 size={13} />
            {isDeleting ? 'Deactivating…' : 'Confirm Deactivate'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

/* ── Main Users Page ────────────────────────────────────────────────── */
export default function UsersPage() {
  const toast = useToast()
  const [users, setUsers]                       = useState(() => getStoredUsers())
  const [showAdd, setShowAdd]                   = useState(false)
  const [editingUser, setEditingUser]           = useState(null)
  const [deactivatingUser, setDeactivatingUser] = useState(null)

  // Policy Setting: allow supervisor to mark other supervisors
  const [supervisorCanMark, setSupervisorCanMark] = useState(() => getSupervisorCanMarkSupervisor())

  useEffect(() => {
    const handleUpdate = () => setUsers(getStoredUsers())
    window.addEventListener('everest:users-updated', handleUpdate)
    return () => window.removeEventListener('everest:users-updated', handleUpdate)
  }, [])

  const reloadUsers = () => setUsers(getStoredUsers())

  const handleToggleSupervisorPolicy = (e) => {
    const nextVal = e.target.checked
    setSupervisorCanMark(nextVal)
    setSupervisorCanMarkSupervisor(nextVal)
    toast(
      nextVal
        ? 'Supervisors are now allowed to mark attendance for other supervisors.'
        : 'Restricted: Supervisors can no longer mark attendance for other supervisors without admin approval.',
      'info'
    )
  }

  return (
    <div className="page-root">
      <PageHeader
        title="User & Supervisor Management"
        subtitle="Manage system operators, role assignments, and attendance policies"
        actions={
          <button className="btn-primary btn-sm gap-1.5" onClick={() => setShowAdd(true)}>
            <Plus size={14} />Add User
          </button>
        }
      />

      {/* Admin Policy Settings Card */}
      <div className="card p-4 space-y-3 bg-zinc-900/60 border-zinc-800">
        <div className="flex items-center gap-2 text-zinc-200 font-semibold text-xs">
          <Settings size={14} className="text-primary-400" />
          <span>Supervisory & Role Policy Controls</span>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-4 pt-2 border-t border-zinc-800/60">
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-zinc-100">
              Allow Supervisors to Mark Attendance for Other Supervisors
            </p>
            <p className="text-2xs text-zinc-500 max-w-xl">
              When disabled, only Administrators can mark or modify supervisor attendance. Supervisors will see protected status locks on other supervisors in the attendance muster roll.
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={supervisorCanMark}
              onChange={handleToggleSupervisorPolicy}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
          </label>
        </div>
      </div>

      {/* Users Table */}
      <div className="table-wrap">
        <table className="table-base">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Department</th>
              <th>Role</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => {
              const isInactive = u.isActive === false
              const color = ROLE_COLORS[u.role] || 'from-zinc-600 to-zinc-700'

              return (
                <tr key={u.id || u.email} className={cn(isInactive && 'opacity-60 bg-zinc-900/30')}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold text-xs shadow shrink-0`}>
                        {u.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <span className="font-semibold text-zinc-200 block text-xs">{u.name}</span>
                        {u.phone && <span className="text-2xs text-zinc-500 font-mono">{u.phone}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="font-mono text-xs text-zinc-400">{u.email}</td>
                  <td className="text-xs text-zinc-300">{u.department || 'Production'}</td>
                  <td>
                    <span className={`badge ${ROLE_BADGE[u.role] || 'badge-gray'} capitalize text-2xs`}>
                      <Shield size={9} />{u.role}
                    </span>
                  </td>
                  <td>
                    {isInactive ? (
                      <span className="badge badge-gray text-2xs">Inactive</span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                        <CheckCircle size={12} />Active
                      </span>
                    )}
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setEditingUser(u)}
                        className="btn-ghost btn-xs text-zinc-400 hover:text-zinc-200"
                        title="Edit user"
                      >
                        <Edit3 size={12} />
                      </button>
                      {!isInactive && u.role !== 'owner' && (
                        <button
                          onClick={() => setDeactivatingUser(u)}
                          className="btn-ghost btn-xs text-red-400/80 hover:text-red-400 hover:bg-red-500/10"
                          title="Deactivate user"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <AddUserModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSaved={reloadUsers}
      />

      <EditUserModal
        open={Boolean(editingUser)}
        user={editingUser}
        onClose={() => setEditingUser(null)}
        onSaved={reloadUsers}
      />

      <DeactivateUserModal
        open={Boolean(deactivatingUser)}
        user={deactivatingUser}
        onClose={() => setDeactivatingUser(null)}
        onDone={reloadUsers}
      />
    </div>
  )
}
