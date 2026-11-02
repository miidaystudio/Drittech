import apiClient from './apiClient';

export const appointmentService = {
  getAppointments: async (params = {}) => {
    return apiClient.get('/appointments', { params });
  },

  getAppointment: async (id) => {
    return apiClient.get(`/appointments/${id}`);
  },

  createAppointment: async (data) => {
    return apiClient.post('/appointments', data);
  },

  updateAppointment: async (id, data) => {
    return apiClient.patch(`/appointments/${id}`, data);
  },

  cancelAppointment: async (id, data = {}) => {
    return apiClient.post(`/appointments/${id}/cancel`, data);
  },

  rescheduleAppointment: async (id, data = {}) => {
    return apiClient.post(`/appointments/${id}/reschedule`, data);
  },

  checkInAppointment: async (id) => {
    return apiClient.post(`/appointments/${id}/check-in`);
  },

  markNoShow: async (id, data = {}) => {
    return apiClient.post(`/appointments/${id}/no-show`, data);
  },

  /**
   * Generates and downloads standard RFC 5545 iCalendar (.ics) file
   */
  downloadIcsFile: (appointment) => {
    try {
      const doctorName = appointment.doctorId?.userId?.name
        ? `Dr. ${appointment.doctorId.userId.name}`
        : 'Physician';
      const departmentName = appointment.departmentId?.name || 'Drittech Clinic';
      const reason = appointment.reasonForVisit || appointment.type || 'Clinical Consultation';

      let dtStart = '';
      let dtEnd = '';

      if (appointment.startTime) {
        const start = new Date(appointment.startTime);
        dtStart = start.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const end = appointment.endTime ? new Date(appointment.endTime) : new Date(start.getTime() + 15 * 60 * 1000);
        dtEnd = end.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      } else {
        const dateStr = appointment.appointmentDate ? appointment.appointmentDate.split('T')[0] : '2026-11-03';
        const timeStr = appointment.slotTime || '09:00';
        const [hh, mm] = timeStr.split(':');
        const start = new Date(`${dateStr}T${hh}:${mm}:00Z`);
        dtStart = start.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const end = new Date(start.getTime() + 15 * 60 * 1000);
        dtEnd = end.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      }

      const icsLines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Drittech Health Systems//Patient Flow Engine//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `UID:drittech-apt-${appointment._id || Date.now()}@drittech.com`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        `DTSTART:${dtStart}`,
        `DTEND:${dtEnd}`,
        `SUMMARY:Medical Appointment with ${doctorName}`,
        `DESCRIPTION:${reason} (${departmentName})`,
        `LOCATION:${departmentName}, Drittech Health Center`,
        'STATUS:CONFIRMED',
        'END:VEVENT',
        'END:VCALENDAR',
      ];

      const icsContent = icsLines.join('\r\n');
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.setAttribute('download', `appointment-${appointment._id || 'drittech'}.ics`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to generate .ics file:', err);
    }
  },
};
