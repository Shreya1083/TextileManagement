import { useState } from 'react'
import { Plus, Bell, Trash2, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import Modal from '../../components/ui/Modal'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ErrorMessage from '../../components/ui/ErrorMessage'
import { EmptyState } from '../../components/ui/EmptyState'
import { useAlerts, useCreateNotification, useDeleteNotification } from '../../hooks/useAPI'
import { cn } from '../../lib/utils'

const SEVERITY_OPTIONS = [
  { value: 'info', label: 'Info', icon: Info, color: 'blue' },
  { value: 'warning', label: 'Warning', icon: AlertTriangle, color: 'amber' },
  { value: 'danger', label: 'Danger', icon: AlertCircle, color: 'red' }
]

const TYPE_OPTIONS = [
  'announcement',
  'machine-down',
  'low-stock',
  'payroll',
  'order-update',
  'system-alert',
  'quality-issue',
  'dispatch'
]

export default function NotificationsPage() {
  const { data: alertsData, isLoading, error } = useAlerts()
  const createMutation = useCreateNotification()
  const deleteMutation = useDeleteNotification()
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    type: 'announcement',
    message: '',
    severity: 'info',
    author: 'Admin'
  })

  const alerts = alertsData?.data || []

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      await createMutation.mutateAsync(formData)
      setIsModalOpen(false)
      setFormData({
        type: 'announcement',
        message: '',
        severity: 'info',
        author: 'Admin'
      })
    } catch (error) {
      console.error('Failed to create notification:', error)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this notification?')) return
    
    try {
      await deleteMutation.mutateAsync(id)
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  const getSeverityConfig = (severity) => {
    return SEVERITY_OPTIONS.find(s => s.value === severity) || SEVERITY_OPTIONS[0]
  }

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage message="Failed to load notifications" />

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Notifications Management"
        subtitle="Create and manage system-wide announcements and alerts"
        action={{
          label: 'New Notification',
          icon: Plus,
          onClick: () => setIsModalOpen(true)
        }}
      />

      {alerts.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications yet"
          description="Create your first notification to broadcast messages to all users"
        />
      ) : (
        <div className="grid gap-4">
          {alerts.map((alert) => {
            const severityConfig = getSeverityConfig(alert.severity)
            const Icon = severityConfig.icon
            
            return (
              <div
                key={alert.id}
                className="card p-5 hover:bg-zinc-800/40 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                    `bg-${severityConfig.color}-500/15 text-${severityConfig.color}-400`
                  )}>
                    <Icon size={18} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn(
                        'text-xs font-semibold uppercase tracking-wider',
                        `text-${severityConfig.color}-400`
                      )}>
                        {alert.type.replace('-', ' ')}
                      </span>
                      <span className="badge badge-secondary">
                        {severityConfig.label}
                      </span>
                    </div>
                    
                    <p className="text-sm text-zinc-200 leading-relaxed mb-2">
                      {alert.message}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                      <span>By {alert.author}</span>
                      <span>•</span>
                      <span>
                        {new Date(alert.createdAt).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(alert.id)}
                    disabled={deleteMutation.isPending}
                    className="icon-btn !text-red-400 hover:!bg-red-500/15"
                    title="Delete notification"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Notification"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">Notification Type</label>
            <select
              className="input"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              required
            >
              {TYPE_OPTIONS.map(type => (
                <option key={type} value={type}>
                  {type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Severity</label>
            <div className="grid grid-cols-3 gap-3">
              {SEVERITY_OPTIONS.map(option => {
                const Icon = option.icon
                const isSelected = formData.severity === option.value
                
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, severity: option.value })}
                    className={cn(
                      'p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2',
                      isSelected
                        ? `border-${option.color}-500 bg-${option.color}-500/10`
                        : 'border-zinc-700 hover:border-zinc-600'
                    )}
                  >
                    <Icon size={20} className={isSelected ? `text-${option.color}-400` : 'text-zinc-400'} />
                    <span className={cn(
                      'text-xs font-medium',
                      isSelected ? `text-${option.color}-400` : 'text-zinc-400'
                    )}>
                      {option.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="label">Message</label>
            <textarea
              className="input min-h-[100px]"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Enter the notification message..."
              required
            />
          </div>

          <div>
            <label className="label">Author</label>
            <input
              type="text"
              className="input"
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              placeholder="Who is sending this notification?"
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="btn-primary flex-1"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Notification'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
