import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarCheck, CheckCircle, XCircle, Users } from 'lucide-react';
import { attendanceApi, employeesApi } from '../services/api';
import type { Attendance, AttendanceStatus, Employee } from '../types';
import { format, getDaysInMonth, startOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import Badge from '../components/ui/Badge';

const statusConfig: Record<AttendanceStatus, { label: string; short: string; color: string; badge: 'success' | 'danger' | 'warning' | 'info' | 'default' }> = {
  PRESENT: { label: 'Présent', short: 'P', color: 'bg-green-100 text-green-700', badge: 'success' },
  ABSENT: { label: 'Absent', short: 'A', color: 'bg-red-100 text-red-700', badge: 'danger' },
  CONGE: { label: 'Congé', short: 'C', color: 'bg-blue-100 text-blue-700', badge: 'info' },
  MALADIE: { label: 'Maladie', short: 'M', color: 'bg-orange-100 text-orange-700', badge: 'warning' },
  REPOS: { label: 'Repos', short: 'R', color: 'bg-gray-100 text-gray-600', badge: 'default' },
  MISSION: { label: 'Mission', short: 'MS', color: 'bg-purple-100 text-purple-700', badge: 'default' }
};

export default function AttendancePage() {
  const qc = useQueryClient();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState(format(now, 'yyyy-MM-dd'));

  const daysInMonth = getDaysInMonth(new Date(year, month - 1));
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const { data: employees = [] } = useQuery({
    queryKey: ['employees-active'],
    queryFn: () => employeesApi.getAll().then(r => r.data as Employee[])
  });

  const { data: records = [] } = useQuery({
    queryKey: ['attendance', year, month],
    queryFn: () => attendanceApi.getAll({ month, year }).then(r => r.data as Attendance[])
  });

  const { data: todaySummary } = useQuery({
    queryKey: ['attendance-summary'],
    queryFn: () => attendanceApi.getSummary().then(r => r.data as { presents: number; absents: number; nonPointed: number; totalEmployees: number })
  });

  const upsertMut = useMutation({
    mutationFn: (d: unknown) => attendanceApi.upsert(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['attendance', year, month] }); qc.invalidateQueries({ queryKey: ['attendance-summary'] }); }
  });

  const bulkMut = useMutation({
    mutationFn: (d: unknown) => attendanceApi.bulk(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['attendance', year, month] }); qc.invalidateQueries({ queryKey: ['attendance-summary'] }); }
  });

  const getRecord = (employeeId: string, day: number) => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return records.find(r => r.employeeId === employeeId && r.date.startsWith(dateStr));
  };

  const cycleStatus = (employeeId: string, day: number) => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const record = getRecord(employeeId, day);
    const statuses: AttendanceStatus[] = ['PRESENT', 'ABSENT', 'CONGE', 'MALADIE', 'REPOS'];
    const currentIdx = record ? statuses.indexOf(record.status) : -1;
    const nextStatus = statuses[(currentIdx + 1) % statuses.length];
    upsertMut.mutate({ employeeId, date: dateStr, status: nextStatus });
  };

  const markAllPresent = () => {
    bulkMut.mutate({
      date: selectedDate,
      records: employees.map(e => ({ employeeId: e.id, status: 'PRESENT' }))
    });
  };

  const monthName = format(startOfMonth(new Date(year, month - 1)), 'MMMM yyyy', { locale: fr });

  return (
    <div className="space-y-5">
      {/* Summary today */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Présents aujourd\'hui', value: todaySummary?.presents || 0, icon: CheckCircle, color: 'text-green-600' },
          { label: 'Absents', value: todaySummary?.absents || 0, icon: XCircle, color: 'text-red-600' },
          { label: 'Non pointés', value: todaySummary?.nonPointed || 0, icon: CalendarCheck, color: 'text-yellow-600' },
          { label: 'Effectif total', value: todaySummary?.totalEmployees || employees.length, icon: Users, color: 'text-primary-600' }
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-4">
            <div className="flex items-center gap-2 mb-1"><Icon className={`w-4 h-4 ${color}`} /><p className="text-xs text-gray-500">{label}</p></div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 justify-between">
        <div className="flex items-center gap-2">
          <select className="input max-w-[120px]" value={month} onChange={e => setMonth(+e.target.value)}>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{format(new Date(2000, i, 1), 'MMMM', { locale: fr })}</option>
            ))}
          </select>
          <select className="input max-w-[90px]" value={year} onChange={e => setYear(+e.target.value)}>
            {[year - 1, year, year + 1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <span className="text-sm text-gray-500 capitalize">{monthName}</span>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" className="input max-w-[160px]" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
          <button onClick={markAllPresent} disabled={bulkMut.isPending} className="btn-primary text-sm">
            <CheckCircle className="w-3.5 h-3.5" /> Tous présents
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-3 flex-wrap">
        {(Object.keys(statusConfig) as AttendanceStatus[]).map(s => (
          <span key={s} className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${statusConfig[s].color}`}>
            <span className="font-bold">{statusConfig[s].short}</span> {statusConfig[s].label}
          </span>
        ))}
        <span className="text-xs text-gray-400">— Cliquez sur une cellule pour changer le statut</span>
      </div>

      {/* Grid */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="table-header sticky left-0 bg-gray-50 min-w-[160px]">Opérateur</th>
                {days.map(d => {
                  const date = new Date(year, month - 1, d);
                  const isWeekend = date.getDay() === 0 || date.getDay() === 5;
                  const isToday = format(date, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');
                  return (
                    <th key={d} className={`table-header text-center w-8 px-1 ${isWeekend ? 'bg-gray-100' : ''} ${isToday ? 'bg-primary-50' : ''}`}>
                      <div className="text-xs font-bold">{d}</div>
                      <div className="text-gray-400" style={{ fontSize: '9px' }}>{format(date, 'EEE', { locale: fr }).slice(0, 2)}</div>
                    </th>
                  );
                })}
                <th className="table-header text-center">P</th>
                <th className="table-header text-center">A</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {employees.map(emp => {
                const empRecords = records.filter(r => r.employeeId === emp.id);
                const presents = empRecords.filter(r => r.status === 'PRESENT').length;
                const absents = empRecords.filter(r => ['ABSENT', 'MALADIE'].includes(r.status)).length;
                return (
                  <tr key={emp.id} className="hover:bg-gray-50">
                    <td className="table-cell sticky left-0 bg-white font-medium">
                      {emp.firstName} {emp.lastName}
                      <br /><span className="text-gray-400 font-normal">{emp.position}</span>
                    </td>
                    {days.map(d => {
                      const record = getRecord(emp.id, d);
                      const date = new Date(year, month - 1, d);
                      const isWeekend = date.getDay() === 0 || date.getDay() === 5;
                      const cfg = record ? statusConfig[record.status] : null;
                      return (
                        <td key={d} className={`text-center px-1 py-1 ${isWeekend ? 'bg-gray-50' : ''}`}>
                          <button
                            onClick={() => cycleStatus(emp.id, d)}
                            className={`w-6 h-6 rounded text-xs font-bold transition-colors ${cfg ? cfg.color : 'bg-gray-100 text-gray-300 hover:bg-gray-200'}`}
                            title={cfg?.label || 'Non pointé'}
                          >
                            {cfg?.short || '·'}
                          </button>
                        </td>
                      );
                    })}
                    <td className="table-cell text-center font-bold text-green-600">{presents}</td>
                    <td className="table-cell text-center font-bold text-red-500">{absents}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
