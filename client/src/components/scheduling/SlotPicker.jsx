import React, { useState, useEffect } from 'react';
import { Sun, CloudSun, Moon, Clock, AlertCircle } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import './SlotPicker.scss';

export const SlotPicker = ({
  slots = [],
  selectedSlot,
  onSelectSlot,
  loading = false,
  date,
  doctorId,
}) => {
  const { socket } = useSocket();
  const [liveSlots, setLiveSlots] = useState(slots);
  const [lockedSlotTimes, setLockedSlotTimes] = useState(new Set());

  // Keep local slots in sync with prop updates
  useEffect(() => {
    setLiveSlots(slots);
    setLockedSlotTimes(new Set());
  }, [slots]);

  // Real-time socket synchronization: instantly drop/lock slot if someone else takes it
  useEffect(() => {
    if (!socket) return;

    const handleSlotLocked = (payload) => {
      // payload: { doctorId, date, slotTime }
      const docMatches = !doctorId || String(payload.doctorId) === String(doctorId);
      const dateMatches = !date || payload.date === date;
      if (docMatches && dateMatches) {
        setLockedSlotTimes((prev) => new Set([...prev, payload.slotTime]));
        // If current selected slot was just locked, unselect it
        if (selectedSlot?.slotTime === payload.slotTime) {
          onSelectSlot(null);
        }
      }
    };

    const handleSlotReleased = (payload) => {
      const docMatches = !doctorId || String(payload.doctorId) === String(doctorId);
      const dateMatches = !date || payload.date === date;
      if (docMatches && dateMatches) {
        setLockedSlotTimes((prev) => {
          const next = new Set(prev);
          next.delete(payload.slotTime);
          return next;
        });
      }
    };

    socket.on('slot:locked', handleSlotLocked);
    socket.on('slot:released', handleSlotReleased);

    return () => {
      socket.off('slot:locked', handleSlotLocked);
      socket.off('slot:released', handleSlotReleased);
    };
  }, [socket, doctorId, date, selectedSlot, onSelectSlot]);

  if (loading) {
    return (
      <div className="slot-picker">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.625rem' }}>
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="cf-skeleton"
              style={{ height: '54px', borderRadius: '10px' }}
            />
          ))}
        </div>
      </div>
    );
  }

  // Filter out truly available slots
  const availableSlots = liveSlots.filter((s) => !lockedSlotTimes.has(s.slotTime));

  if (availableSlots.length === 0) {
    return (
      <div className="slot-picker__empty">
        <Clock size={28} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
        <p style={{ margin: '0 0 0.25rem', fontWeight: 600, color: '#FFFFFF' }}>
          No Slots Available
        </p>
        <p style={{ margin: 0, fontSize: '0.8125rem' }}>
          All appointments are booked or the doctor is off duty on this date.
        </p>
      </div>
    );
  }

  // Group by Morning, Afternoon, Evening
  const morning = availableSlots.filter((s) => s.slotTime < '12:00');
  const afternoon = availableSlots.filter((s) => s.slotTime >= '12:00' && s.slotTime < '17:00');
  const evening = availableSlots.filter((s) => s.slotTime >= '17:00');

  const groups = [
    { title: 'Morning', icon: Sun, slots: morning },
    { title: 'Afternoon', icon: CloudSun, slots: afternoon },
    { title: 'Evening', icon: Moon, slots: evening },
  ].filter((g) => g.slots.length > 0);

  return (
    <div className="slot-picker" role="radiogroup" aria-label="Available appointment slots">
      {groups.map((group) => (
        <div key={group.title} className="slot-picker__group">
          <div className="slot-picker__group-title">
            <group.icon size={15} />
            <span>{group.title}</span>
            <span style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 400 }}>
              ({group.slots.length} available)
            </span>
          </div>

          <div className="slot-picker__grid">
            {group.slots.map((slot) => {
              const isSelected = selectedSlot?.slotTime === slot.slotTime;
              const isLocked = lockedSlotTimes.has(slot.slotTime);

              return (
                <button
                  key={slot.slotTime}
                  type="button"
                  className={`slot-picker__item ${isSelected ? 'slot-picker__item--selected' : ''} ${
                    isLocked ? 'slot-picker__item--locked' : ''
                  }`}
                  disabled={isLocked}
                  onClick={() => onSelectSlot(slot)}
                  role="radio"
                  aria-checked={isSelected}
                  aria-label={`${slot.slotTime} (${slot.durationMinutes || 15} mins)`}
                >
                  <span>{slot.slotTime}</span>
                  <span className="slot-picker__item-duration">
                    {slot.durationMinutes || 15}m
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
