import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, momentLocalizer, EventProps, SlotInfo, DateHeaderProps } from 'react-big-calendar';
// Drag & Drop addon
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import moment from 'moment';
import { CalendarEvent, CalendarEventStatus } from '../types';
import { getCalendarEvents, addCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '../services/supabase';
import { EventDetailModal } from './EventDetailModal';
import { DayEventsModal } from './DayEventsModal';
import { motion } from 'framer-motion';

import 'react-big-calendar/lib/css/react-big-calendar.css';
import './ContentCalendar.css';

const localizer = momentLocalizer(moment);

// Ensure Monday is the first day of week
moment.updateLocale('en', { week: { dow: 1 } });

const statusColors: Record<CalendarEventStatus, string> = {
  planned: 'bg-slate-500 border-slate-400',
  in_progress: 'bg-indigo-500 border-indigo-400',
  completed: 'bg-emerald-500 border-emerald-400',
  cancelled: 'bg-red-500 border-red-400',
};

const CustomEvent: React.FC<EventProps<CalendarEvent>> = ({ event }) => {
  const getPriorityIcon = (status: CalendarEventStatus) => {
    switch (status) {
      case 'planned': return '⏰';
      case 'in_progress': return '⚡';
      case 'completed': return '✅';
      case 'cancelled': return '❌';
      default: return '📅';
    }
  };

  const bgColor = statusColors[event.status].split(' ')[0];

  return (
    <div
      className={`${bgColor} rounded text-white text-xs flex items-center cursor-pointer min-h-[24px] overflow-hidden border-0`}
      title={event.title}
      style={{ lineHeight: '1.2', fontSize: '11px', padding: '2px 4px', whiteSpace: 'nowrap', width: '100%' }}
    >
      <span style={{ marginRight: 2, opacity: 0.9, fontSize: 8 }}>{getPriorityIcon(event.status)}</span>
      <span className="truncate font-medium" style={{ fontSize: 9 }}>{event.title}</span>
    </div>
  );
};

interface ContentCalendarProps {
  onNavigateToArticle?: (id: string) => void;
}

export const ContentCalendar: React.FC<ContentCalendarProps> = ({ onNavigateToArticle }) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Partial<CalendarEvent> | null>(null);
  const [statusFilter, setStatusFilter] = useState<CalendarEventStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetched = await getCalendarEvents();
      const processed = fetched.map(e => {
        const isValid = (d: any) => d instanceof Date && !isNaN(d.valueOf());
        const s0 = e.start_date instanceof Date ? e.start_date : new Date(e.start_date);
        const s = isValid(s0) ? s0 : new Date();
        const startLocal = new Date(s.getFullYear(), s.getMonth(), s.getDate());
        const end0 = e.end_date instanceof Date ? e.end_date : new Date(e.end_date as any);
        const endBase = isValid(end0) ? end0 : s;
        // For month view correctness in RBC, end should be exclusive
        const endLocalExclusive = new Date(endBase.getFullYear(), endBase.getMonth(), endBase.getDate() + 1);
        return {
          ...e,
          start: startLocal,
          end: endLocalExclusive,
          // add an allDay hint (extra field, harmless)
          allDay: true as any,
        };
      });
      setEvents(processed);
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const getEventsForDate = (date: Date) => {
    const target = moment(date).startOf('day');
    return events.filter(ev => moment(ev.start).startOf('day').isSame(target, 'day'));
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsEventModalOpen(true);
  };

  const handleSelectSlot = (slotInfo: SlotInfo) => {
    const d = slotInfo.start;
    setSelectedDate(d);
    setIsDayModalOpen(true);
  };

  const handleCloseEventModal = () => {
    setIsEventModalOpen(false);
    setSelectedEvent(null);
  };

  const handleSave = async (newEvent: Omit<CalendarEvent, 'id' | 'user_id'>) => {
    await addCalendarEvent(newEvent);
    fetchEvents();
  };

  const handleUpdate = async (id: string, updates: Partial<CalendarEvent>) => {
    await updateCalendarEvent(id, updates);
    fetchEvents();
  };

  const handleDelete = async (id: string) => {
    await deleteCalendarEvent(id);
    fetchEvents();
  };

  const filteredEvents = (statusFilter === 'all' ? events : events.filter(e => e.status === statusFilter))
    .filter(e => (searchTerm.trim().length === 0) || e.title.toLowerCase().includes(searchTerm.toLowerCase()) || (e.notes || '').toLowerCase().includes(searchTerm.toLowerCase()));

  const CustomDateHeader: React.FC<DateHeaderProps> = ({ label, date }) => {
    const dayEvents = getEventsForDate(date);
    const eventCount = dayEvents.length;
    const isToday = moment(date).isSame(moment(), 'day');
    return (
      <div className={`relative h-full w-full flex flex-col items-center justify-center p-2 ${isToday ? 'ring-2 ring-indigo-400/30' : ''}`}>
        <div className="relative flex items-center justify-center mb-1">
          <span className={`text-sm font-semibold ${isToday ? 'text-indigo-300' : 'text-slate-300'}`}>{label}</span>
        </div>
        {eventCount > 0 && (
          <div className="absolute bottom-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold rounded-full border border-white/10 shadow bg-indigo-500/90 text-white">
            {eventCount}
          </div>
        )}
      </div>
    );
  };

  if (isLoading && events.length === 0) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center rounded-2xl">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="text-center">
          <div className="mb-4">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full mx-auto" />
          </div>
          <div className="text-white text-xl font-medium mb-2">Loading Calendar...</div>
          <div className="w-24 h-1 bg-indigo-500/20 rounded-full mx-auto overflow-hidden">
            <motion.div className="h-full bg-indigo-500 rounded-full" animate={{ width: ['0%', '100%', '0%'] }} transition={{ duration: 2, repeat: Infinity }} />
          </div>
        </motion.div>
      </div>
    );
  }

  // Drag & Drop handlers
  const toPlainDate = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const handleEventDrop = async ({ event, start, end }: any) => {
    try {
      const newStart = toPlainDate(start);
      const endExclusive = toPlainDate(end);
      const newEndInclusive = new Date(endExclusive);
      newEndInclusive.setDate(newEndInclusive.getDate() - 1);
      await handleUpdate(event.id, { start_date: newStart, end_date: newEndInclusive });
    } catch (e) {
      console.error('Failed to move event', e);
    }
  };
  const handleEventResize = async ({ event, start, end }: any) => {
    try {
      const newStart = toPlainDate(start);
      const endExclusive = toPlainDate(end);
      const newEndInclusive = new Date(endExclusive);
      newEndInclusive.setDate(newEndInclusive.getDate() - 1);
      await handleUpdate(event.id, { start_date: newStart, end_date: newEndInclusive });
    } catch (e) {
      console.error('Failed to resize event', e);
    }
  };

  const DnDCalendar = withDragAndDrop(Calendar as any);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="min-h-[85vh] flex flex-col relative overflow-hidden rounded-2xl p-6"
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-gradient-to-r from-slate-800/60 to-slate-900/60 p-6 rounded-2xl border border-slate-700/30 backdrop-blur-md mb-6 shadow-2xl"
        >
          {/* Row 1: Title + Add */}
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl border border-indigo-500/30">
                <svg className="h-6 w-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Content Calendar</h1>
                <p className="text-slate-300 text-sm mt-1">Plan, track, and organize your content schedule</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <motion.button
                onClick={() => {
                  const baseDate = selectedDate || new Date();
                  setSelectedEvent({ start_date: baseDate, end_date: baseDate, status: 'planned', title: '' });
                  setIsEventModalOpen(true);
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-blue-500/25"
                title="Add Event"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </motion.button>
            </div>
          </div>

          {/* Row 2: Search + Filters (scrollable) */}
          <div className="flex flex-col gap-3">
            <div className="relative w-full">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search events..."
                className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all duration-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {(['all', 'planned', 'in_progress', 'completed', 'cancelled'] as (CalendarEventStatus | 'all')[]).map((filter) => {
                const isActive = statusFilter === filter;
                const count = filter === 'all' ? events.length : events.filter(e => e.status === filter).length;
                const chipColors: Record<CalendarEventStatus | 'all', string> = {
                  all: 'bg-slate-600/30 hover:bg-slate-500/30 border-slate-500/50 text-slate-200',
                  planned: 'bg-slate-500/30 hover:bg-slate-400/40 border-slate-400/50 text-slate-200',
                  in_progress: 'bg-indigo-500/30 hover:bg-indigo-400/40 border-indigo-400/50 text-indigo-200',
                  completed: 'bg-emerald-500/30 hover:bg-emerald-400/40 border-emerald-400/50 text-emerald-200',
                  cancelled: 'bg-red-500/30 hover:bg-red-400/40 border-red-400/50 text-red-200',
                };
                const activeColors = isActive ? chipColors[filter].replace(/\/30/g, '/50').replace(/\/40/g, '/60') : chipColors[filter];

                return (
                  <motion.button key={filter} onClick={() => setStatusFilter(filter)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 flex items-center gap-1.5 ${isActive ? activeColors.replace(/hover:/g, '').replace(/30/g, '50') : activeColors}`}>
                    <span className={`w-2 h-2 rounded-full ${isActive ? 'opacity-100' : 'opacity-50'}`} style={{ backgroundColor: isActive ? '#6366f1' : '#94a3be' }} />
                    <span>{filter === 'all' ? 'All' : filter.replace('_', ' ')}</span>
                    <span className="text-slate-400 ml-1">({count})</span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-gradient-to-br from-slate-800/20 to-slate-900/20 p-4 rounded-2xl shadow-2xl backdrop-blur-2xl border border-slate-700/30 flex-1 min-h-[60vh] relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none" />
          <div className="relative z-10 h-full">
            <DnDCalendar
              localizer={localizer}
              events={filteredEvents}
              startAccessor="start"
              endAccessor="end"
              defaultView="month"
              style={{ height: '100%' }}
              components={{
                event: CustomEvent,
                month: { dateHeader: CustomDateHeader },
              }}
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              selectable
              popup
              resizable
              onEventDrop={handleEventDrop}
              onEventResize={handleEventResize}
              draggableAccessor={() => true}
            />
          </div>
        </motion.div>
      </motion.div>

      <DayEventsModal
        isOpen={isDayModalOpen}
        onClose={() => setIsDayModalOpen(false)}
        date={selectedDate}
        events={selectedDate ? getEventsForDate(selectedDate) : []}
        onSave={handleSave}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />

      <EventDetailModal
        isOpen={isEventModalOpen}
        onClose={handleCloseEventModal}
        event={selectedEvent}
        onSave={handleSave}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        onNavigateToArticle={onNavigateToArticle}
      />
    </>
  );
};
