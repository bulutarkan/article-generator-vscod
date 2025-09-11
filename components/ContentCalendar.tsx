import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, momentLocalizer, EventProps, SlotInfo, DateHeaderProps } from 'react-big-calendar';
import moment from 'moment';
import { CalendarEvent, CalendarEventStatus } from '../types';
import { getCalendarEvents, addCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '../services/supabase';
import { EventDetailModal } from './EventDetailModal';
import { motion } from 'framer-motion';

import 'react-big-calendar/lib/css/react-big-calendar.css';
import './ContentCalendar.css';

const localizer = momentLocalizer(moment);

// Set Monday as the first day of the week globally for moment.js
moment.updateLocale('en', {
    week: {
        dow: 1, // Monday is the first day of the week
    },
});

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
            title={`${event.title}`}
            style={{
                lineHeight: '1.2',
                fontSize: '11px',
                padding: '2px 4px',
                whiteSpace: 'nowrap',
                width: '100%'
            }}
        >
            <span style={{ marginRight: '2px', opacity: 0.9, fontSize: '8px' }}>
                {getPriorityIcon(event.status)}
            </span>
            <span className="truncate font-medium" style={{ fontSize: '9px' }}>
                {event.title}
            </span>
        </div>
    );
};

interface ContentCalendarProps {
    onNavigateToArticle?: (id: string) => void;
}

export const ContentCalendar: React.FC<ContentCalendarProps> = ({ onNavigateToArticle }) => {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<Partial<CalendarEvent> | null>(null);
    const [eventsForSelectedDate, setEventsForSelectedDate] = useState<CalendarEvent[]>([]);
    const [statusFilter, setStatusFilter] = useState<CalendarEventStatus | 'all'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDateForSidebar, setSelectedDateForSidebar] = useState<Date | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const fetchEvents = useCallback(async () => {
        setIsLoading(true);
        try {
            const fetchedEvents = await getCalendarEvents();
            // Convert string dates to Date objects for localizer
            const processedEvents = fetchedEvents.map(event => ({
                ...event,
                start_date: moment(event.start_date).toDate(), // Keep original start_date as Date object
                end_date: event.end_date ? moment(event.end_date).toDate() : moment(event.start_date).toDate(), // Keep original end_date as Date object
                start: moment(event.start_date).toDate(), // Add 'start' property for react-big-calendar
                end: event.end_date ? moment(event.end_date).toDate() : moment(event.start_date).toDate() // Add 'end' property for react-big-calendar
            }));
            setEvents(processedEvents);
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
        const normalizedCalendarDate = moment(date).startOf('day');
        return events.filter(event => {
            // Use the 'start' property directly for comparison, as it's already a Date object
            const normalizedEventDate = moment(event.start).startOf('day');
            return normalizedEventDate.isSame(normalizedCalendarDate, 'day');
        });
    };

    const getProgress = (status: CalendarEventStatus) => {
        switch (status) {
            case 'planned': return 25;
            case 'in_progress': return 60;
            case 'completed': return 100;
            case 'cancelled': return 0;
            default: return 0;
        }
    };

    const getPriorityIcon = (status: CalendarEventStatus) => {
        switch (status) {
            case 'planned': return '⏰';
            case 'in_progress': return '⚡';
            case 'completed': return '✅';
            case 'cancelled': return '❌';
            default: return '📅';
        }
    };

    const handleSelectEvent = (event: CalendarEvent) => {
        setSelectedEvent(event);
        setIsModalOpen(true);
    };

    const handleSelectSlot = (slotInfo: SlotInfo) => {
        const selectedDate = slotInfo.start;
        setSelectedDateForSidebar(selectedDate);
        setEventsForSelectedDate(getEventsForDate(selectedDate));
        setIsSidebarOpen(true);
    };

    const handleCloseSidebar = () => {
        setIsSidebarOpen(false);
        setSelectedDateForSidebar(null);
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

    console.log('Filtered events for display:', filteredEvents); // Debug: Check filtered events
    console.log('Current status filter:', statusFilter);

    const CustomDateHeader = ({ label, date }: { label: string; date: Date }) => {
        const eventsForDate = getEventsForDate(date);
        const eventCount = eventsForDate.length;
        const today = new Date();
        const isToday = date.toDateString() === today.toDateString();
        const totalEvents = events.length;
        const dateEventsPercentage = totalEvents > 0 ? Math.round((eventCount / totalEvents) * 100) : 0;

        // Calculate status distribution for this date
        const statusDistribution = {
            planned: eventsForDate.filter(e => e.status === 'planned').length,
            in_progress: eventsForDate.filter(e => e.status === 'in_progress').length,
            completed: eventsForDate.filter(e => e.status === 'completed').length,
            cancelled: eventsForDate.filter(e => e.status === 'cancelled').length,
        };

        const dominantStatus = Object.entries(statusDistribution).reduce((a, b) => (a[1] as number) > (b[1] as number) ? a : b)[0] as CalendarEventStatus;

        return (
            <div className={`relative h-full w-full flex flex-col items-center justify-center p-2 transition-all duration-200 ${isToday ? 'ring-2 ring-indigo-400/30' : ''}`}>
                {/* Date number with status indicator */}
                <div className="relative flex items-center justify-center mb-1">
                    <span className={`text-sm font-semibold ${isToday ? 'text-indigo-300' : 'text-slate-300'} ${eventCount > 0 ? `text-${statusColors[dominantStatus].split('-')[1]}-300` : ''}`}>
                        {label}
                    </span>

                    {/* Event count badge */}
                    {eventCount > 0 && (
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className={`absolute -top-2 -right-2 flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full border-2 border-white/20 shadow-lg ${statusColors[dominantStatus].includes('indigo') ? 'bg-indigo-500 text-white' :
                                    statusColors[dominantStatus].includes('emerald') ? 'bg-emerald-500 text-white' :
                                        statusColors[dominantStatus].includes('red') ? 'bg-red-500 text-white' :
                                            statusColors[dominantStatus].includes('slate') ? 'bg-slate-500 text-white' : 'bg-indigo-500 text-white'
                                }`}
                        >
                            {eventCount > 9 ? `${Math.floor(eventCount / 10)}` : eventCount}
                        </motion.div>
                    )}

                    {/* Today indicator */}
                    {isToday && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-indigo-400 rounded-full border-2 border-white/20"
                        />
                    )}
                </div>

                {/* Mini progress bar for date events */}
                {eventCount > 0 && (
                    <div className="w-full h-0.5 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                            className={`h-full rounded-full transition-all duration-500`}
                            style={{
                                backgroundColor: statusColors[dominantStatus].split(' ')[0],
                                width: `${Math.min(dateEventsPercentage, 100)}%`
                            }}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(dateEventsPercentage, 100)}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                    </div>
                )}

                {/* Status distribution dots (if multiple events) */}
                {eventCount > 1 && (
                    <div className="flex gap-0.5 mt-1 w-full justify-center">
                        {Object.entries(statusDistribution).map(([status, count]) =>
                            count > 0 && (
                                <div
                                    key={status}
                                    className={`w-1.5 h-1.5 rounded-full border border-white/20 ${statusColors[status as CalendarEventStatus].includes('indigo') ? 'bg-indigo-400' :
                                            statusColors[status as CalendarEventStatus].includes('emerald') ? 'bg-emerald-400' :
                                                statusColors[status as CalendarEventStatus].includes('red') ? 'bg-red-400' :
                                                    statusColors[status as CalendarEventStatus].includes('slate') ? 'bg-slate-400' : 'bg-indigo-400'
                                        }`}
                                    title={`${count} ${status.replace('_', ' ')} events`}
                                />
                            )
                        )}
                    </div>
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
                className="min-h-[85vh] flex flex-col relative overflow-hidden rounded-2xl p-6"
            >
                {/* Modern Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="bg-gradient-to-r from-slate-800/60 to-slate-900/60 p-6 rounded-2xl border border-slate-700/30 backdrop-blur-md mb-6 shadow-2xl"
                >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl border border-indigo-500/30">
                                <svg className="h-6 w-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white tracking-tight">Content Calendar</h1>
                                <p className="text-slate-300 text-sm mt-1">Plan, track, and organize your content creation schedule</p>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="relative flex-1 max-w-full md:max-w-md">
                            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search events..."
                                className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all duration-200"
                                onChange={(e) => {
                                    // TODO: Implement search functionality
                                }}
                            />
                        </div>

                        {/* Filter Chips */}
                        <div className="flex flex-wrap gap-2 items-center">
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
                                    <motion.button
                                        key={filter}
                                        onClick={() => setStatusFilter(filter)}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 flex items-center gap-1.5 ${isActive ? activeColors.replace(/hover:/g, '').replace(/30/g, '50') : activeColors}`}
                                    >
                                        <span className={`w-2 h-2 rounded-full ${isActive ? 'opacity-100' : 'opacity-50'}`} style={{ backgroundColor: isActive ? '#6366f1' : '#94a3be' }} />
                                        <span>{filter === 'all' ? 'All' : filter.replace('_', ' ')}</span>
                                        <span className="text-slate-400 ml-1">({count})</span>
                                    </motion.button>
                                );
                            })}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3">
                            <motion.button
                                onClick={() => setIsModalOpen(true)}
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
                </motion.div>

                {/* Calendar Container */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="bg-gradient-to-br from-slate-800/20 to-slate-900/20 p-4 rounded-2xl shadow-2xl backdrop-blur-2xl border border-slate-700/30 flex-1 min-h-[60vh] relative"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none"></div>
                    <div className="relative z-10 h-full">
                        <Calendar
                            localizer={localizer}
                            events={filteredEvents}
                            startAccessor="start"
                            endAccessor="end"
                            defaultView="month"
                            style={{ height: '100%' }}
                            components={{
                                event: CustomEvent, /* Re-enable CustomEvent */
                                header: CustomDateHeader
                            }}
                            onSelectEvent={handleSelectEvent}
                            onSelectSlot={handleSelectSlot}
                            selectable
                            popup
                        />
                    </div>
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
            {/* Day Events Sidebar */}
            {isSidebarOpen && selectedDateForSidebar && (
                <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="fixed inset-y-0 right-0 z-50 w-full sm:max-w-md bg-slate-900/95 backdrop-blur-xl border-l border-slate-700/50"
                >
                    <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/20 rounded-lg">
                                <svg className="h-5 w-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white">
                                    Events for {moment(selectedDateForSidebar).format('MMMM DD, YYYY')}
                                </h3>
                                <p className="text-slate-400 text-sm">
                                    {eventsForSelectedDate.length} event{eventsForSelectedDate.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>
                        <motion.button
                            onClick={handleCloseSidebar}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded-lg transition-all duration-200"
                        >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </motion.button>
                    </div>

                    <div className="p-6 overflow-y-auto max-h-[calc(100vh-8rem)]">
                        {eventsForSelectedDate.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="p-4 bg-slate-700/30 rounded-xl w-fit mx-auto mb-4">
                                    <svg className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <p className="text-slate-400 text-sm">No events scheduled</p>
                                <p className="text-slate-500 text-xs mt-1">Add your first event for this day</p>
                                <motion.button
                                    onClick={() => setIsModalOpen(true)}
                                    whileHover={{ scale: 1.05 }}
                                    className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm transition-all duration-200"
                                >
                                    Add Event
                                </motion.button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {eventsForSelectedDate.map((event) => (
                                    <motion.div
                                        key={event.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`p-4 rounded-xl border-l-4 ${statusColors[event.status]} border-opacity-100 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer`}
                                        onClick={() => {
                                            setSelectedEvent(event);
                                            setIsModalOpen(true);
                                        }}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold">{getPriorityIcon(event.status)}</span>
                                                <h4 className="font-semibold text-white text-sm leading-tight">
                                                    {event.title}
                                                </h4>
                                            </div>
                                            <span className="text-xs text-slate-300">
                                                {moment(event.start_date).format('HH:mm')}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${statusColors[event.status].replace('bg-', 'bg-')}`}></div>
                                                <span className="text-xs capitalize text-slate-200">
                                                    {event.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <span className="text-xs text-slate-400">
                                                {getProgress(event.status)}%
                                            </span>
                                        </div>
                                        {event.end_date && (
                                            <div className="text-xs text-slate-400 mb-2">
                                                {moment.duration(moment(event.end_date).diff(event.start_date)).humanize()}
                                            </div>
                                        )}
                                        <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-700 ${statusColors[event.status].split(' ')[0]}`}
                                                style={{ width: `${getProgress(event.status)}%` }}
                                            />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            )}

        </>
    );
};
