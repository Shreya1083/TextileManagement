import { useState } from 'react'
import { Plus, Shield, CheckCircle } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Modal }      from '../../components/ui/Modal'

const USERS = [
  { id:1, name:'Rajesh Sharma',  email:'owner@everest.com',      role:'owner',      color:'from-primary-500 to-violet-600'  },
  { id:2, name:'Kamla Devi',     email:'store@everest.com',      role:'store',      color:'from-cyan-500 to-blue-600'       },
  { id:3, name:'Arvind Kumar',   email:'supervisor@everest.com', role:'supervisor', color:'from-amber-500 to-orange-600'    },
  { id:4, name:'Neha Shah',      email:'inspector@everest.com',  role:'inspector',  color:'from-emerald-500 to-teal-600'   },
  { id:5, name:'Pradeep Gupta',  email:'accounts@everest.com',   role:'accounts',   color:'from-pink-500 to-rose-600'      },
]
const ROLE_BADGE = { owner:'badge-primary', store:'badge-blue', supervisor:'badge-yellow', inspector:'badge-green', accounts:'badge-orange' }

export default function UsersPage() {
  const [showAdd, setShowAdd] = useState(false)
  return (
    <div className="page-root">
      <PageHeader title="User Management" subtitle="System users and role assignments"
        actions={<button className="btn-primary btn-sm" onClick={() => setShowAdd(true)}><Plus size={14} />Add User</button>}
      />
      <div className="table-wrap">
        <table className="table-base">
          <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {USERS.map(u => (
              <tr key={u.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${u.color} flex items-center justify-center text-white font-bold text-xs`}>
                      {u.name.charAt(0)}
                    </div>
                    <span className="font-semibold text-zinc-200">{u.name}</span>
                  </div>
                </td>
                <td className="font-mono text-xs text-zinc-400">{u.email}</td>
                <td>
                  <span className={`badge ${ROLE_BADGE[u.role] || 'badge-gray'} capitalize`}>
                    <Shield size={9} />{u.role}
                  </span>
                </td>
                <td>
                  <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                    <CheckCircle size={12} />Active
                  </span>
                </td>
                <td><button className="btn-ghost btn-xs text-zinc-500">Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add User" description="Create a new ERP user account">
        <div className="space-y-4">
          <div><label className="label">Full Name</label><input className="input" /></div>
          <div><label className="label">Email</label><input className="input" type="email" /></div>
          <div><label className="label">Role</label>
            <select className="input">
              <option value="owner">Owner</option>
              <option value="store">Store Keeper</option>
              <option value="supervisor">Production Supervisor</option>
              <option value="inspector">Quality Inspector</option>
              <option value="accounts">Accounts</option>
            </select>
          </div>
          <div><label className="label">Temporary Password</label><input className="input" type="password" /></div>
          <div className="flex justify-end gap-2 pt-2">
            <button className="btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="btn-primary">Create User</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
