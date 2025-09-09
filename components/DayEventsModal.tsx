import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { CalendarEvent, CalendarEventStatus } from '../types';
import { EventDetailModal } from './EventDetailModal';

interface DayEventsModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  events: CalendarEvent[];
  onSave: (event: Omit<CalendarEvent, 'id' | 'user_id'>) => Promise<void>;
  onUpdate: (id: string, updates: Partial<CalendarEvent>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const statusColors: Record<CalendarEventStatus, string> = {
  planned: 'bg-gray-500',
  in_progress: 'bg-blue-500',
  completed: 'bg-green-500',
  cancelled: 'bg-red-500',
};

const formatDate = (date: Date | null): string => {
  if (!date) return '';
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

export const DayEventsModal: React.FC<DayEventsModalProps> = ({ 
  isOpen, 
  onClose, 
  date, 
  events,
  onSave,
  onUpdate,
  onDelete
}) => {
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Partial<CalendarEvent> | null>(null);

  const handleAddEvent = () => {
    setSelectedEvent({ 
      start_date: date || new Date(),
      end_date: date || new Date()
    });
    setIsEventModalOpen(true);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsEventModalOpen(true);
  };

  const handleCloseEventModal = () => {
    setIsEventModalOpen(false);
    setSelectedEvent(null);
  };

  const handleEventSave = async (event: Omit<CalendarEvent, 'id' | 'user_id'>) => {
    await onSave(event);
    handleCloseEventModal();
  };

  const handleEventUpdate = async (id: string, updates: Partial<CalendarEvent>) => {
    await onUpdate(id, updates);
    handleCloseEventModal();
  };

  const handleEventDelete = async (id: string) => {
    await onDelete(id);
    handleCloseEventModal();
  };

  if (!isOpen || !date) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
        <div 
          className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl w-full max-w-2xl m-4 max-h-[90vh] flex flex-col animate-slide-in-up"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-white/10">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">
                Events for {formatDate(date)}
              </h2>
              <button 
                onClick={onClose}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-slate-400 mt-1">
              {events.length} event{events.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {events.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-400 mb-4">No events scheduled for this day</p>
                <button
                  onClick={handleAddEvent}
                  className="px-4 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 transition-colors"
                >
                  Add Event
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {events.map((event) => (
                  <div 
                    key={event.id} 
                    className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 hover:border-slate-500 transition-colors cursor-pointer"
                    onClick={() => handleEditEvent(event)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-white">{event.title}</h3>
                        <div className="flex items-center mt-2">
                          <span className={`inline-block w-3 h-3 rounded-full mr-2 ${statusColors[event.status]}`}></span>
                          <span className="text-sm text-slate-300 capitalize">
                            {event.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                      </div>
                    </div>
                    {event.notes && (
                      <p className="text-slate-400 text-sm mt-2 line-clamp-2">
                        {event.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-6 border-t border-white/10">
            <button
              onClick={handleAddEvent}
              className="w-full py-3 rounded-lg font-medium text-white bg-indigo-600 hover:bg-indigo-500 transition-colors flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add New Event
            </button>
          </div>
        </div>
      </div>

      <EventDetailModal
        isOpen={isEventModalOpen}
        onClose={handleCloseEventModal}
        event={selectedEvent}
        onSave={handleEventSave}
        onUpdate={handleEventUpdate}
        onDelete={handleEventDelete}
        onArticleGenerated={(articleId) => {
          console.log('Article generated from day view with ID:', articleId);
          // We can add additional logic here if needed
        }}
      />
    </>,
    document.body
  );
};
