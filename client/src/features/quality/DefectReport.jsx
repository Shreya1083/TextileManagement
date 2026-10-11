import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts'
import { CheckCircle2, AlertTriangle, ShieldCheck, Download } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { ExportMenu } from '../../components/ui/ExportMenu'
import { exportPDF, exportExcel, exportCSV } from '../../lib/exportUtils'
import { useRolls } from '../../hooks/useAPI'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b']
const COLUMNS = ['Defect Type', 'Count', 'Share %']

export default function DefectReport() {
  const { data: rollsData, isLoading, error } = useRolls()
  const rolls = useMemo(() => rollsData?.data || [], [rollsData])

  const { defectReport, totalDefects, passedRolls, rejectedRolls, reworkRolls, passRate } = useMemo(() => {
    const defectCounts = {}
    let total = 0

    rolls.forEach(r => {
      if (r.defects) {
        const defs = String(r.defects)
          .split(',')
          .map(d => d.trim())
          .filter(Boolean)
        defs.forEach(d => {
          defectCounts[d] = (defectCounts[d] || 0) + 1
          total++
        })
      }
    })

    const report = Object.entries(defectCounts)
      .map(([type, count]) => ({
        type,
        count,
        pct: total ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)

    const passed = rolls.filter(r => r.status === 'PASSED').length
    const rejected = rolls.filter(r => r.status === 'REJECTED').length
    const rework = rolls.filter(r => r.status === 'REWORK').length
    const totalInspected = passed + rejected + rework
    const rate = totalInspected > 0 ? ((passed / totalInspected) * 100).toFixed(1) : '100.0'

    return {
      defectReport: report,
      totalDefects: total,
      passedRolls: passed,
      rejectedRolls: rejected,
      reworkRolls: rework,
      passRate: rate,
    }
  }, [rolls])

  const qualityData = [
    { name: 'Passed Rolls', value: passedRolls, color: '#10b981', label: `${passRate}% Pass Rate` },
    { name: 'Rework Required', value: reworkRolls, color: '#f59e0b', label: 'Reprocessing' },
    { name: 'Rejected Rolls', value: rejectedRolls, color: '#ef4444', label: 'Scrapped / Loss' },
  ]

  const handleExportPDF = () =>
    exportPDF({
      title: 'Defect Report',
      subtitle: 'Quality defect analysis by type and frequency',
      columns: COLUMNS,
      rows: defectReport.map(d => [d.type, d.count, `${d.pct}%`]),
      filename: 'DefectReport',
    })

  const handleExportExcel = () =>
    exportExcel({
      filename: 'DefectReport',
      sheetName: 'Defects',
      columns: COLUMNS,
      rows: defectReport.map(d => [d.type, d.count, d.pct]),
    })

  const handleExportCSV = () => {
    exportCSV(
      'DefectReport.csv',
      COLUMNS,
      defectReport.map(d => [d.type, d.count, `${d.pct}%`])
    )
  }

  if (isLoading) return <div className="page-root"><LoadingSpinner /></div>
  if (error) return <div className="page-root"><ErrorMessage message={error.message} /></div>

  return (
    <div className="page-root">
      <PageHeader
        title="Defect Reports"
        subtitle={`Quality defect analysis by type, machine & root-cause · ${rolls.length} total rolls monitored`}
        actions={
          <div className="flex items-center gap-2">
            <button className="btn-secondary btn-sm" onClick={handleExportCSV}>
              <Download size={13} /> Export CSV
            </button>
            <ExportMenu onExportPDF={handleExportPDF} onExportExcel={handleExportExcel} />
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {qualityData.map(d => (
          <div key={d.name} className="card p-5 flex items-center gap-4 relative overflow-hidden">
            <div className="w-2.5 h-14 rounded-full shrink-0" style={{ background: d.color }} />
            <div className="flex-1 min-w-0">
              <p className="text-3xl font-extrabold text-zinc-100">{d.value}</p>
              <p className="text-sm font-semibold text-zinc-300 mt-0.5">{d.name}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{d.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts & Tables Grid */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Defects by Type Bar Chart */}
        <div className="card">
          <div className="section-header flex items-center justify-between">
            <p className="section-title">Defects by Type — Frequency</p>
            <span className="text-xs font-mono text-zinc-400">{totalDefects} incidents detected</span>
          </div>
          <div className="p-5">
            {defectReport.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-zinc-900/40 rounded-xl border border-zinc-800/80">
                <ShieldCheck size={36} className="text-emerald-400 mb-2" />
                <p className="text-sm font-semibold text-zinc-200">Zero Defects Recorded</p>
                <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                  All inspected rolls are meeting high-grade quality standards.
                </p>
              </div>
            ) : (
              <div style={{ width: '100%', height: Math.max(260, defectReport.length * 42) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={defectReport}
                    layout="vertical"
                    margin={{ top: 10, right: 20, left: 95, bottom: 10 }}
                  >
                    <CartesianGrid stroke="#27272a" strokeDasharray="3 3" horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fill: '#71717a', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <YAxis
                      dataKey="type"
                      type="category"
                      tick={{ fill: '#d4d4d8', fontSize: 12, fontWeight: 500 }}
                      axisLine={false}
                      tickLine={false}
                      width={100}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#18181b',
                        border: '1px solid #3f3f46',
                        borderRadius: 10,
                        fontSize: 12,
                        color: '#f4f4f5',
                      }}
                      formatter={(val) => [`${val} rolls`, 'Count']}
                    />
                    <Bar dataKey="count" name="Count" radius={[0, 6, 6, 0]} barSize={20}>
                      {defectReport.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Defect Distribution Table */}
        <div className="card">
          <div className="section-header flex items-center justify-between">
            <p className="section-title">Defect Distribution & Share</p>
            <span className="text-xs text-zinc-500">Sorted by impact</span>
          </div>
          <div className="p-5">
            {defectReport.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-zinc-900/40 rounded-xl border border-zinc-800/80">
                <CheckCircle2 size={36} className="text-emerald-400 mb-2" />
                <p className="text-sm font-semibold text-zinc-200">No Defect Distribution</p>
                <p className="text-xs text-zinc-500 mt-1">
                  100% production conformity across all active looms and batches.
                </p>
              </div>
            ) : (
              <div className="table-wrap border-0">
                <table className="table-base">
                  <thead>
                    <tr>
                      <th>Defect Type</th>
                      <th>Count</th>
                      <th>Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {defectReport.map((d, i) => (
                      <tr key={d.type} className="hover:bg-zinc-800/40 transition-colors">
                        <td>
                          <div className="flex items-center gap-2.5">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ background: COLORS[i % COLORS.length] }}
                            />
                            <span className="font-medium text-zinc-200 text-xs">{d.type}</span>
                          </div>
                        </td>
                        <td className="font-bold text-zinc-100 text-xs">{d.count}</td>
                        <td>
                          <div className="flex items-center gap-2.5">
                            <div className="flex-1 h-2 bg-zinc-800 rounded-full max-w-[100px] overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${d.pct}%`,
                                  background: COLORS[i % COLORS.length],
                                }}
                              />
                            </div>
                            <span className="text-zinc-400 text-xs font-mono font-medium">{d.pct}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
