/**
 * hrStorage.js
 * Persistent local storage manager for Workers, Attendance, and Users.
 * Keeps data synced and persistent across page refreshes.
 */
import { mockWorkers, mockWorkerProfiles } from '../mocks/data'
import { DEMO_USERS } from '../context/AuthContext'

const WORKERS_KEY = 'everest_workers'
const ATTENDANCE_KEY = 'everest_attendance_records'
const USERS_KEY = 'everest_users'
const SETTINGS_KEY = 'everest_settings'

// Initial seed for workers (including supervisors as employees)
const INITIAL_WORKERS = [
  ...mockWorkers.map((w, i) => ({
    ...w,
    department: w.dept || 'Production',
    shift: mockWorkerProfiles[i]?.shift || 'Morning',
    phone: mockWorkerProfiles[i]?.phone || '+91 98000 00000',
    email: `${w.name.split(' ')[0].toLowerCase()}@everest.com`,
    isActive: true,
    joinDate: mockWorkerProfiles[i]?.joined || '2021-01-15',
    wageBasis: w.basis || 'daily',
    dailyWage: w.wage || 650,
  })),
  // Default supervisor as worker record
  {
    id: 'W-SUP-01',
    employeeId: 'W-SUP-01',
    name: 'Arvind Kumar',
    role: 'Production Supervisor',
    department: 'Production',
    shift: 'Morning',
    phone: '+91 98765 11223',
    email: 'supervisor@everest.com',
    isActive: true,
    joinDate: '2019-06-01',
    wageBasis: 'daily',
    dailyWage: 1200,
    present: 26,
    month: 'Oct',
    net: 31200,
  },
]

// Initial seed for users
const INITIAL_USERS = [
  ...DEMO_USERS.map((u, idx) => ({
    id: u.email,
    name: u.name,
    email: u.email,
    role: u.role,
    department: u.dept,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  })),
]

// ── Workers ──────────────────────────────────────────────────────────────────

export function getStoredWorkers() {
  try {
    const raw = localStorage.getItem(WORKERS_KEY)
    if (!raw) {
      localStorage.setItem(WORKERS_KEY, JSON.stringify(INITIAL_WORKERS))
      return INITIAL_WORKERS
    }
    return JSON.parse(raw)
  } catch {
    return INITIAL_WORKERS
  }
}

export function saveStoredWorkers(workers) {
  try {
    localStorage.setItem(WORKERS_KEY, JSON.stringify(workers))
    window.dispatchEvent(new CustomEvent('everest:workers-updated', { detail: workers }))
  } catch (err) {
    console.error('Failed to save workers to storage:', err)
  }
}

export function addStoredWorker(workerData) {
  const current = getStoredWorkers()
  const exists = current.some(
    w => w.id?.toLowerCase() === workerData.employeeId?.toLowerCase() ||
         w.employeeId?.toLowerCase() === workerData.employeeId?.toLowerCase()
  )
  if (exists) {
    throw new Error(`Worker with Employee ID "${workerData.employeeId}" already exists.`)
  }

  const newWorker = {
    id: workerData.employeeId,
    employeeId: workerData.employeeId,
    name: workerData.fullName || workerData.name,
    role: workerData.role || 'Spinner Operator',
    department: workerData.department || workerData.dept || 'Production',
    dept: workerData.department || workerData.dept || 'Production',
    shift: workerData.shift || 'Morning',
    phone: workerData.phone || '',
    email: workerData.email || workerData.loginEmail || '',
    wageBasis: workerData.wageBasis || 'daily',
    basis: workerData.wageBasis || 'daily',
    wage: Number(workerData.dailyWage) || 650,
    dailyWage: Number(workerData.dailyWage) || 650,
    joinDate: workerData.joiningDate || workerData.joinDate || new Date().toISOString().split('T')[0],
    isActive: workerData.isActive !== undefined ? Boolean(workerData.isActive) : true,
    present: 0,
    month: new Date().toLocaleString('default', { month: 'short' }),
    net: 0,
    rfidUid: workerData.rfidUid || '',
  }

  const updated = [newWorker, ...current]
  saveStoredWorkers(updated)
  return newWorker
}

export function updateStoredWorker(id, updates) {
  const current = getStoredWorkers()
  const idx = current.findIndex(w => w.id === id || w.employeeId === id)
  if (idx === -1) {
    throw new Error('Worker not found')
  }

  current[idx] = {
    ...current[idx],
    ...updates,
    dept: updates.department || updates.dept || current[idx].dept,
    wage: updates.dailyWage !== undefined ? Number(updates.dailyWage) : current[idx].wage,
    dailyWage: updates.dailyWage !== undefined ? Number(updates.dailyWage) : current[idx].dailyWage,
  }

  saveStoredWorkers([...current])
  return current[idx]
}

export function removeOrDeactivateWorker(id) {
  const current = getStoredWorkers()
  const target = current.find(w => w.id === id || w.employeeId === id)
  if (!target) {
    throw new Error('Worker not found')
  }

  // Check historical records
  const allAttendance = getStoredAttendance()
  const hasHistory = allAttendance.some(a => a.workerId === target.id || a.workerId === target.employeeId) ||
                     (target.present && target.present > 0)

  if (hasHistory) {
    // Safe deactivation
    target.isActive = false
    saveStoredWorkers([...current])
    return {
      action: 'DEACTIVATED',
      message: `Worker ${target.name} (${target.id}) has historical records and was safely deactivated.`,
      worker: target,
    }
  }

  const filtered = current.filter(w => w.id !== id && w.employeeId !== id)
  saveStoredWorkers(filtered)
  return {
    action: 'DELETED',
    message: `Worker ${target.name} (${target.id}) was removed successfully.`,
    worker: target,
  }
}

// ── Attendance ───────────────────────────────────────────────────────────────

export function getStoredAttendance() {
  try {
    const raw = localStorage.getItem(ATTENDANCE_KEY)
    if (!raw) {
      // Generate some default attendance records for today
      const today = new Date().toISOString().split('T')[0]
      const defaultRecords = INITIAL_WORKERS.slice(0, 6).map((w, i) => ({
        id: `ATT-${w.id}-${today}-Morning`,
        workerId: w.id,
        workerName: w.name,
        workerRole: w.role,
        department: w.department,
        shift: 'Morning',
        date: today,
        status: i === 1 ? 'ABSENT' : i === 2 ? 'HALF_DAY' : 'PRESENT',
        checkInTime: '08:00',
        checkOutTime: '17:00',
        overtimeHours: i === 0 ? 2 : 0,
        markedBy: 'Arvind Kumar (Supervisor)',
        markedAt: new Date().toISOString(),
      }))
      localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(defaultRecords))
      return defaultRecords
    }
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export function saveStoredAttendance(records) {
  try {
    localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(records))
    window.dispatchEvent(new CustomEvent('everest:attendance-updated', { detail: records }))
  } catch (err) {
    console.error('Failed to save attendance:', err)
  }
}

export function markBulkAttendance({ date, shift, records, markedBy, markedByRole }) {
  const all = getStoredAttendance()
  const workers = getStoredWorkers()

  const updatedRecords = [...all]
  const savedItems = []

  for (const item of records) {
    const targetWorker = workers.find(w => w.id === item.workerId || w.employeeId === item.workerId)
    if (!targetWorker) continue

    // Rule: Supervisor cannot mark attendance for another supervisor unless permitted
    const isTargetSupervisor = targetWorker.role?.toLowerCase().includes('supervisor')
    if (markedByRole === 'supervisor' && isTargetSupervisor) {
      const allowed = getSupervisorCanMarkSupervisor()
      if (!allowed) {
        throw new Error(`Supervisors are not permitted to mark attendance for supervisor "${targetWorker.name}".`)
      }
    }

    if (!targetWorker.isActive) {
      throw new Error(`Cannot mark attendance for deactivated worker "${targetWorker.name}".`)
    }

    const recId = `ATT-${targetWorker.id}-${date}-${shift}`
    const existingIdx = updatedRecords.findIndex(r => r.workerId === targetWorker.id && r.date === date && r.shift === shift)

    const recordPayload = {
      id: recId,
      workerId: targetWorker.id,
      workerName: targetWorker.name,
      workerRole: targetWorker.role,
      department: targetWorker.department,
      date,
      shift,
      status: item.status || 'PRESENT',
      checkInTime: item.checkInTime || '08:00',
      checkOutTime: item.checkOutTime || '17:00',
      overtimeHours: Number(item.overtimeHours) || 0,
      markedBy: markedBy || 'Supervisor',
      markedAt: new Date().toISOString(),
    }

    if (existingIdx >= 0) {
      updatedRecords[existingIdx] = {
        ...updatedRecords[existingIdx],
        ...recordPayload,
      }
      savedItems.push(updatedRecords[existingIdx])
    } else {
      updatedRecords.push(recordPayload)
      savedItems.push(recordPayload)
    }
  }

  saveStoredAttendance(updatedRecords)
  return savedItems
}

export function correctAttendanceRecord({ recordId, newStatus, reason, correctedBy }) {
  if (!reason || !reason.trim()) {
    throw new Error('A reason is required to correct attendance.')
  }

  const all = getStoredAttendance()
  const idx = all.findIndex(r => r.id === recordId)
  if (idx === -1) {
    throw new Error('Attendance record not found')
  }

  const original = all[idx]
  all[idx] = {
    ...original,
    originalStatus: original.status,
    status: newStatus,
    correctionReason: reason.trim(),
    correctedBy: correctedBy || 'Supervisor',
    correctedAt: new Date().toISOString(),
  }

  saveStoredAttendance([...all])
  return all[idx]
}

// ── Settings ─────────────────────────────────────────────────────────────────

export function getSupervisorCanMarkSupervisor() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return false
    const parsed = JSON.parse(raw)
    return Boolean(parsed.supervisor_can_mark_supervisor)
  } catch {
    return false
  }
}

export function setSupervisorCanMarkSupervisor(enabled) {
  try {
    const current = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')
    current.supervisor_can_mark_supervisor = Boolean(enabled)
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(current))
  } catch (err) {
    console.error('Failed to save settings:', err)
  }
}

// ── Users ────────────────────────────────────────────────────────────────────

export function getStoredUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    if (!raw) {
      localStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_USERS))
      return INITIAL_USERS
    }
    return JSON.parse(raw)
  } catch {
    return INITIAL_USERS
  }
}

export function saveStoredUsers(users) {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
    window.dispatchEvent(new CustomEvent('everest:users-updated', { detail: users }))
  } catch (err) {
    console.error('Failed to save users:', err)
  }
}

export function addStoredUser(userData) {
  const current = getStoredUsers()
  const exists = current.some(u => u.email.toLowerCase() === userData.email.toLowerCase())
  if (exists) {
    throw new Error(`User with email "${userData.email}" already exists.`)
  }

  const newUser = {
    id: userData.email,
    name: userData.name,
    email: userData.email,
    role: userData.role,
    department: userData.department || 'Production',
    isActive: true,
    createdAt: new Date().toISOString(),
  }

  // If role is supervisor, ensure an employee record also exists
  if (userData.role === 'supervisor') {
    const workers = getStoredWorkers()
    const workerExists = workers.some(w => w.email.toLowerCase() === userData.email.toLowerCase())
    if (!workerExists) {
      addStoredWorker({
        employeeId: `SUP-${(workers.length + 1).toString().padStart(3, '0')}`,
        fullName: userData.name,
        role: 'Production Supervisor',
        department: userData.department || 'Production',
        shift: 'Morning',
        phone: userData.phone || '',
        email: userData.email,
        wageBasis: 'daily',
        dailyWage: 1200,
      })
    }
  }

  const updated = [newUser, ...current]
  saveStoredUsers(updated)
  return newUser
}

export function updateStoredUser(id, updates) {
  const current = getStoredUsers()
  const idx = current.findIndex(u => u.id === id || u.email === id)
  if (idx === -1) {
    throw new Error('User not found')
  }

  current[idx] = { ...current[idx], ...updates }
  saveStoredUsers([...current])
  return current[idx]
}

export function removeOrDeactivateUser(id) {
  const current = getStoredUsers()
  const target = current.find(u => u.id === id || u.email === id)
  if (!target) {
    throw new Error('User not found')
  }

  // Deactivate safely preserving records
  target.isActive = false
  saveStoredUsers([...current])

  // Also deactivate corresponding worker record if exists
  const workers = getStoredWorkers()
  const workerIdx = workers.findIndex(w => w.email?.toLowerCase() === target.email?.toLowerCase())
  if (workerIdx >= 0) {
    workers[workerIdx].isActive = false
    saveStoredWorkers([...workers])
  }

  return {
    action: 'DEACTIVATED',
    message: `User ${target.name} (${target.email}) deactivated successfully. Historical records preserved.`,
    user: target,
  }
}
