import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts'
import { PageHeader }     from '../../components/ui/PageHeader'
import { mockDefectReport, mockQualityData } from '../../mocks/data'

const COLORS = ['#ef4444','#f59e0b','#3b82f6','#8b5cf6','#64748b']

export default function DefectReport() {
  return (
    <div className="page-root">
      <PageHeader title="Defect Reports" subtitle="Quality defect analysis by type, machine and order" />
      <div className="grid grid-cols-3 gap-4">
        {mockQualityData.map(d => (
          <div key={d.name} className="card p-5 flex items-center gap-4">
            <div className="w-3 h-14 rounded-full shrink-0" style={{ background: d.color }} />
            <div>
              <p className="text-2xl font-bold text-zinc-50">{d.value}</p>
              <p className="text-sm text-zinc-400 mt-0.5">{d.name}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="section-header"><p className="section-title">Defects by Type — This Month</p></div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={mockDefectReport} layout="vertical" margin={{ top:0, right:8, left:80, bottom:0 }}>
                <CartesianGrid stroke="#27272a" strokeDasharray="4 4" horizontal={false} />
                <XAxis type="number" tick={{ fill:'#52525b', fontSize:10 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="type" type="category" tick={{ fill:'#a1a1aa', fontSize:11 }} axisLine={false} tickLine={false} width={90} />
                <Tooltip contentStyle={{ background:'#18181b', border:'1px solid #27272a', borderRadius:12, fontSize:11 }} />
                <Bar dataKey="count" name="Count" radius={[0,6,6,0]}>
                  {mockDefectReport.map((_,i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <div className="section-header"><p className="section-title">Defect Distribution</p></div>
          <div className="p-5">
            <table className="table-base">
              <thead><tr><th>Defect Type</th><th>Count</th><th>Share</th></tr></thead>
              <tbody>
                {mockDefectReport.map((d,i) => (
                  <tr key={d.type}>
                    <td><div className="flex items-center gap-2.5"><span className="w-2.5 h-2.5 rounded-full" style={{background:COLORS[i%COLORS.length]}} />{d.type}</div></td>
                    <td className="font-bold">{d.count}</td>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="flex-1 h-1.5 bg-zinc-800 rounded-full max-w-[80px]">
                          <div className="h-1.5 rounded-full" style={{width:`${d.pct}%`,background:COLORS[i%COLORS.length]}} />
                        </div>
                        <span className="text-zinc-500 text-xs">{d.pct}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
