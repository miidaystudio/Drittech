import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { schedulingService } from '../../services/schedulingService';
import './AppointmentCalendar.scss';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAY_HEADERS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const AppointmentCalendar = ({
  selectedDate,
  onSelectDate,
  doctorId = null,
  departmentId = null,
  minDate = new Date(),
  maxDays = 30,
}) => {
  const [viewDate, setViewDate] = useState(() => {
    const d = selectedDate ? new Date(selectedDate) : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(false);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth(); // 0-11

  // Fetch month summary for availability flags
  useEffect(() => {
    let isMounted = true;
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const res = await schedulingService.getCalendarSummary({
          doctorId,
          departmentId,
          year,
          month: month + 1,
        });
        if (isMounted && res.success) {
          setSummary(res.data);
        }
      } catch (err) {
        // Fallback gracefully
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchSummary();
    return () => {
      isMounted = false;
    };
  }, [doctorId, departmentId, year, month]);

  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + maxDays);

  // Month grid calculations
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days = [];
  // Leading empty cells
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push({ empty: true, key: `empty-${i}` });
  }
  // Days of current month
  for (let d = 1; d <= daysInMonth; d++) {
    const dayDate = new Date(year, month, d);
    dayDate.setHours(0, 0, 0, 0);
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    const isPast = dayDate < today;
    const isBeyondMax = dayDate > maxDate;
    const daySummary = summary[dateStr];
    const isBlocked = daySummary && daySummary.hasAvailability === false;
    const isDisabled = isPast || isBeyondMax || isBlocked;
    const isToday = dayDate.getTime() === today.getTime();
    const isSelected = selectedDate === dateStr;
    const hasSlots = daySummary && daySummary.hasAvailability === true;

    days.push({
      dateStr,
      dayNumber: d,
      isDisabled,
      isToday,
      isSelected,
      hasSlots,
      key: dateStr,
    });
  }

  const handleKeyDown = (e, dateStr, isDisabled) => {
    if ((e.key === 'Enter' || e.key === ' ') && !isDisabled) {
      e.preventDefault();
      onSelectDate(dateStr);
    }
  };

  return (
    <div className="apt-calendar" role="region" aria-label="Appointment booking calendar">
      <div className="apt-calendar__header">
        <h4>{MONTH_NAMES[month]} {year}</h4>
        <div style={{ display: 'flex', gap: '0.375rem' }}>
          <button
            type="button"
            className="apt-calendar__nav-btn"
            onClick={handlePrevMonth}
            disabled={year === today.getFullYear() && month <= today.getMonth()}
            aria-label="Previous month"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            className="apt-calendar__nav-btn"
            onClick={handleNextMonth}
            aria-label="Next month"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="apt-calendar__weekdays" aria-hidden="true">
        {WEEKDAY_HEADERS.map((h) => (
          <span key={h}>{h}</span>
        ))}
      </div>

      <div className="apt-calendar__grid" role="grid">
        {days.map((item) => {
          if (item.empty) {
            return <div key={item.key} className="apt-calendar__day apt-calendar__day--empty" aria-hidden="true" />;
          }

          const classNames = [
            'apt-calendar__day',
            item.isSelected ? 'apt-calendar__day--selected' : '',
            item.isToday ? 'apt-calendar__day--today' : '',
            item.isDisabled ? 'apt-calendar__day--disabled' : '',
          ].filter(Boolean).join(' ');

          return (
            <button
              key={item.key}
              type="button"
              className={classNames}
              disabled={item.isDisabled}
              onClick={() => onSelectDate(item.dateStr)}
              onKeyDown={(e) => handleKeyDown(e, item.dateStr, item.isDisabled)}
              aria-label={`${item.dayNumber} ${MONTH_NAMES[month]} ${year}${item.isDisabled ? ' (Unavailable)' : ''}`}
              aria-selected={item.isSelected}
              role="gridcell"
            >
              <span>{item.dayNumber}</span>
              {item.hasSlots && !item.isSelected && <span className="apt-calendar__day__dot" />}
            </button>
          );
        })}
      </div>

      <div className="apt-calendar__legend" aria-hidden="true">
        <div className="apt-calendar__legend-item">
          <span className="apt-calendar__legend-dot apt-calendar__legend-dot--available" />
          <span>Available</span>
        </div>
        <div className="apt-calendar__legend-item">
          <span className="apt-calendar__legend-dot apt-calendar__legend-dot--selected" />
          <span>Selected</span>
        </div>
        <div className="apt-calendar__legend-item">
          <span className="apt-calendar__legend-dot apt-calendar__legend-dot--disabled" />
          <span>Unavailable</span>
        </div>
      </div>
    </div>
  );
};
