import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/* ──────────────────────────────────────────────────────────────
   CalendarView  —  shows deadlines from saved internships
   Props:
     applications  – array of normalised application docs
     onEventClick  – called with the event object when clicked
────────────────────────────────────────────────────────────── */
const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];
const WEEK_DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const CalendarView = ({ applications = [], onEventClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const today        = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear  = currentDate.getFullYear();

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const daysInMonth     = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayWeekday = firstDayOfMonth.getDay();

  /* ── Build events map { 'Mon Jun 10 2026': [ event, ... ] } ── */
  const eventsMap = useMemo(() => {
    const acc = {};
    const push = (dateVal, event) => {
      const dt = new Date(dateVal);
      if (isNaN(dt.getTime())) return;
      const key = dt.toDateString();
      if (!acc[key]) acc[key] = [];
      acc[key].push(event);
    };

    applications.forEach(app => {
      const company = app.company || '';
      const title   = app.title   || 'Internship';
      const label   = `${company ? company + ' – ' : ''}${title}`;

      if (app.deadline) {
        push(app.deadline, {
          id: `deadline-${app._id || app.id}`,
          type: 'deadline',
          title: label,
          subtitle: 'Deadline',
          app,
          color: 'bg-red-500',
          dot: 'bg-red-500',
          textColor: 'text-red-700',
          bgLight: 'bg-red-50',
        });
      }
      if (app.interviewDate) {
        push(app.interviewDate, {
          id: `interview-${app._id || app.id}`,
          type: 'interview',
          title: label,
          subtitle: 'Interview',
          app,
          color: 'bg-violet-500',
          dot: 'bg-violet-500',
          textColor: 'text-violet-700',
          bgLight: 'bg-violet-50',
        });
      }
      if (app.followUpDate) {
        push(app.followUpDate, {
          id: `followup-${app._id || app.id}`,
          type: 'followup',
          title: label,
          subtitle: 'Follow Up',
          app,
          color: 'bg-blue-500',
          dot: 'bg-blue-500',
          textColor: 'text-blue-700',
          bgLight: 'bg-blue-50',
        });
      }
    });
    return acc;
  }, [applications]);

  const getDayEvents = (day) => {
    const key = new Date(currentYear, currentMonth, day).toDateString();
    return eventsMap[key] || [];
  };

  const isToday = (day) =>
    today.getDate() === day &&
    today.getMonth() === currentMonth &&
    today.getFullYear() === currentYear;

  const navigate = (dir) => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + dir);
      return d;
    });
  };

  /* ── Upcoming events for list below calendar ── */
  const upcomingEvents = useMemo(() => {
    const now = Date.now();
    return Object.entries(eventsMap)
      .flatMap(([dateStr, evts]) => evts.map(e => ({ ...e, dateStr })))
      .filter(e => new Date(e.dateStr).getTime() >= now - 864e5) // include today
      .sort((a, b) => new Date(a.dateStr) - new Date(b.dateStr))
      .slice(0, 8);
  }, [eventsMap]);

  return (
    <div className="flex flex-col gap-4">

      {/* ── Month nav ── */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-slate-800">
          {MONTH_NAMES[currentMonth]} {currentYear}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate(-1)}
            className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:border-slate-300 transition-all"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-2 py-1 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition-all"
          >
            Today
          </button>
          <button
            onClick={() => navigate(1)}
            className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:border-slate-300 transition-all"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Legend ── */}
      <div className="flex items-center gap-3 text-[10px] font-semibold text-slate-500">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />Deadline</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-500 inline-block" />Interview</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />Follow-up</span>
      </div>

      {/* ── Grid ── */}
      <div className="rounded-xl border border-slate-100 overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
          {WEEK_DAYS.map(d => (
            <div key={d} className="py-1.5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wide">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {/* Empty cells before month start */}
          {Array.from({ length: firstDayWeekday }, (_, i) => (
            <div key={`e-${i}`} className="min-h-[52px] border-r border-b border-slate-50 bg-slate-50/50" />
          ))}

          {Array.from({ length: daysInMonth }, (_, i) => {
            const day   = i + 1;
            const dayEvts = getDayEvents(day);
            const isCurrentDay = isToday(day);
            const col   = (i + firstDayWeekday) % 7;
            const isLastCol = col === 6;

            return (
              <div
                key={day}
                className={`min-h-[52px] p-1 border-b border-slate-100 cursor-default transition-colors
                  ${isLastCol ? '' : 'border-r'}
                  ${isCurrentDay ? 'bg-indigo-50/70' : 'hover:bg-slate-50/80'}
                `}
              >
                <div className={`text-[11px] font-bold mb-0.5 w-5 h-5 flex items-center justify-center rounded-full
                  ${isCurrentDay ? 'bg-indigo-600 text-white' : 'text-slate-700'}`}>
                  {day}
                </div>
                <div className="space-y-0.5">
                  {dayEvts.slice(0, 2).map(evt => (
                    <button
                      key={evt.id}
                      onClick={() => onEventClick?.(evt)}
                      className={`w-full text-left px-1 py-0.5 rounded text-[9px] font-semibold truncate ${evt.color} text-white leading-tight`}
                      title={`${evt.subtitle}: ${evt.title}`}
                    >
                      {evt.subtitle}
                    </button>
                  ))}
                  {dayEvts.length > 2 && (
                    <div className="text-[9px] text-slate-400 px-1">+{dayEvts.length - 2}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Upcoming events list ── */}
      {upcomingEvents.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Upcoming</h3>
          <div className="space-y-2">
            {upcomingEvents.map(evt => {
              const dt = new Date(evt.dateStr);
              const diffDays = Math.ceil((dt - Date.now()) / 864e5);
              const label = diffDays === 0 ? 'Today' : diffDays === 1 ? 'Tomorrow' : `in ${diffDays}d`;
              return (
                <button
                  key={evt.id}
                  onClick={() => onEventClick?.(evt)}
                  className={`w-full text-left flex items-center gap-3 p-2.5 rounded-xl ${evt.bgLight} border border-transparent hover:border-slate-200 transition-all`}
                >
                  <span className={`w-2 h-2 rounded-full ${evt.dot} shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{evt.title}</p>
                    <p className={`text-[10px] font-semibold ${evt.textColor}`}>{evt.subtitle}</p>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 shrink-0 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {upcomingEvents.length === 0 && (
        <div className="text-center py-4">
          <p className="text-xs text-slate-400 font-medium">No upcoming deadlines</p>
          <p className="text-[10px] text-slate-300 mt-1">Set deadlines on saved internships to see them here</p>
        </div>
      )}
    </div>
  );
};

export default CalendarView;