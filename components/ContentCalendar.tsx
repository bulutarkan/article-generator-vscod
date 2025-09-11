import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, momentLocalizer, EventProps, SlotInfo, DateHeaderProps } from 'react-big-calendar';
import moment from 'moment';
import { CalendarEvent, CalendarEventStatus } from '../types';
import { getCalendarEvents, addCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '../services/supabase';
import { EventDetailModal } from './EventDetailModal';
import { DayEventsModal } from './DayEventsModal';
import { motion } from 'framer-motion';

import 'react-big-calendar/lib/css/react-big-calendar.css';
import './ContentCalendar.css';

const localizer = momentLocalizer(moment);

const statusColors: Record<CalendarEventStatus, string> = {
    planned: 'bg-slate-500 border-slate-400',
    in_progress: 'bg-indigo-500 border-indigo-400',
    completed: 'bg-emerald-500 border-emerald-400',
    cancelled: 'bg-red-500 border-red-400',
};

const CustomEvent: React.FC<EventProps<CalendarEvent>> = ({ event }) => (
    <motion.div
        className={`${statusColors[event.status]} p-2 rounded-lg text-white text-xs h-full border-l-4 flex flex-col justify-center cursor-pointer transition-all duration-200 hover:opacity-90`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
    >
        <strong className="font-medium leading-tight">{event.title}</strong>
        <p className="capitalize opacity-90 flex items-center mt-1">
            <span className={`inline-block w-2 h-2 rounded-full mr-2 ${statusColors[event.status].replace('bg-', 'bg-')}`}></span>
            {event.status.replace('_', ' ')}
        </p>
    </motion.div>
);

interface ContentCalendarProps {
    onNavigateToArticle?: (id: string) => void;
}

export const ContentCalendar: React.FC<ContentCalendarProps> = ({ onNavigateToArticle }) => {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<Partial<CalendarEvent> | null>(null);
    const [isDayModalOpen, setIsDayModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [eventsForSelectedDate, setEventsForSelectedDate] = useState<CalendarEvent[]>([]);
    const [statusFilter, setStatusFilter] = useState<CalendarEventStatus | 'all'>('all');

    const fetchEvents = useCallback(async () => {
        setIsLoading(true);
        try {
            const fetchedEvents = await getCalendarEvents();
            setEvents(fetchedEvents);
        } catch (error) {
            console.error("Failed to fetch events:", error);
            // TODO: show error to user
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const getEventsForDate = (date: Date) => {
        return events.filter(event => {
            const eventDate = new Date(event.start_date);
            return eventDate.getDate() === date.getDate() &&
                eventDate.getMonth() === date.getMonth() &&
                eventDate.getFullYear() === date.getFullYear();
        });
    };

    const handleSelectEvent = (event: CalendarEvent) => {
        setSelectedEvent(event);
        setIsModalOpen(true);
    };

    const handleSelectSlot = (slotInfo: SlotInfo) => {
        setSelectedDate(slotInfo.start);
        setEventsForSelectedDate(getEventsForDate(slotInfo.start));
        setIsDayModalOpen(true);
    };

    const handleCloseDayModal = () => {
        setIsDayModalOpen(false);
        setSelectedDate(null);
        setEventsForSelectedDate([]);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedEvent(null);
    };


    const handleSave = async (newEvent: Omit<CalendarEvent, 'id' | 'user_id'>) => {
        await addCalendarEvent(newEvent);
        fetchEvents(); // Refresh
    };

    const handleUpdate = async (id: string, updates: Partial<CalendarEvent>) => {
        await updateCalendarEvent(id, updates);
        fetchEvents(); // Refresh
    };

    const handleDelete = async (id: string) => {
        await deleteCalendarEvent(id);
        fetchEvents(); // Refresh
    };

    if (isLoading && events.length === 0) {
        return (
            <div className="min-h-[85vh] flex items-center justify-center rounded-2xl">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="text-center"
                >
                    <div className="mb-4">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full mx-auto"
                        />
                    </div>
                    <div className="text-white text-xl font-medium mb-2">Loading Calendar...</div>
                    <div className="w-24 h-1 bg-indigo-500/20 rounded-full mx-auto overflow-hidden">
                        <motion.div
                            className="h-full bg-indigo-500 rounded-full"
                            animate={{ width: ['0%', '100%', '0%'] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                    </div>
                </motion.div>
            </div>
        );
    }

    const filteredEvents = statusFilter === 'all'
        ? events
        : events.filter(event => event.status === statusFilter);

    const CustomDateHeader = ({ label, date }: { label: string; date: Date }) => {
        const eventsForDate = getEventsForDate(date);
        const eventCount = eventsForDate.length;

        return (
            <div className="relative h-full w-full flex items-center justify-center">
                <span className="text-sm font-medium text-slate-300">{label}</span>
                {eventCount > 0 && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 bg-indigo-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold"
                    >
                        {eventCount}
                    </motion.div>
                )}
            </div>
        );
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="min-h-[85vh] relative overflow-hidden rounded-2xl p-6"
            >
                {/* Modern Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 mb-6"
                >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/20 rounded-lg">
                                <svg className="h-6 w-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white">Content Calendar</h1>
                                <p className="text-slate-400 text-sm">Plan and track your content creation schedule</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as CalendarEventStatus | 'all')}
                                className="px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            >
                                <option value="all">All Events ({events.length})</option>
                                <option value="planned">Planned ({events.filter(e => e.status === 'planned').length})</option>
                                <option value="in_progress">In Progress ({events.filter(e => e.status === 'in_progress').length})</option>
                                <option value="completed">Completed ({events.filter(e => e.status === 'completed').length})</option>
                                <option value="cancelled">Cancelled ({events.filter(e => e.status === 'cancelled').length})</option>
                            </select>

                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/20 transform hover:scale-105"
                            >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                <span>Add Event</span>
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Calendar Container */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="bg-white/5 p-4 rounded-xl shadow-lg backdrop-blur-xl border border-white/10 h-[70vh]"
                >
                    <Calendar
                        localizer={localizer}
                        events={filteredEvents}
                        startAccessor="start_date"
                        endAccessor="end_date"
                        style={{ height: '100%' }}
                        components={{
                            event: CustomEvent,
                            header: CustomDateHeader
                        }}
                        onSelectEvent={handleSelectEvent}
                        onSelectSlot={handleSelectSlot}
                        selectable
                    />
                </motion.div>
            </motion.div>
            <EventDetailModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                event={selectedEvent}
                onSave={handleSave}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                onArticleGenerated={(articleId) => {
                    console.log('Article generated with ID:', articleId);
                    // Refresh events to reflect status change
                    fetchEvents();
                }}
                onNavigateToArticle={onNavigateToArticle}
            />
            <DayEventsModal
                isOpen={isDayModalOpen}
                onClose={handleCloseDayModal}
                date={selectedDate}
                events={eventsForSelectedDate}
                onSave={handleSave}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
            />
        </>
    );
};
