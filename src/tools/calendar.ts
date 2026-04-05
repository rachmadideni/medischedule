import {
  getAvailableSlots,
  createAppointment,
  rescheduleAppointment,
  cancelAppointment,
  getAppointmentById,
} from "../db/queries.js";

export const calendarTools = {
  getAvailableSlots: {
    name: "getAvailableSlots",
    description:
      "Get available appointment slots for a doctor in a date range. Returns 30-minute time slots that are not already booked.",
    parameters: {
      type: "object",
      properties: {
        doctorId: { type: "number", description: "The doctor's ID" },
        startDate: {
          type: "string",
          description: "Start date in YYYY-MM-DD format",
        },
        endDate: {
          type: "string",
          description: "End date in YYYY-MM-DD format",
        },
      },
      required: ["doctorId", "startDate", "endDate"],
    },
    handler: async (params: {
      doctorId: number;
      startDate: string;
      endDate: string;
    }) => {
      const slots = await getAvailableSlots(
        params.doctorId,
        params.startDate,
        params.endDate
      );
      return { slots, count: slots.length };
    },
  },

  createEvent: {
    name: "createEvent",
    description:
      "Book a new appointment for a patient with a doctor at a specific date and time.",
    parameters: {
      type: "object",
      properties: {
        doctorId: { type: "number", description: "The doctor's ID" },
        patientId: { type: "number", description: "The patient's ID" },
        datetime: {
          type: "string",
          description: "Appointment datetime in ISO format",
        },
        duration: {
          type: "number",
          description: "Duration in minutes (default: 30)",
        },
        reason: { type: "string", description: "Reason for the visit" },
      },
      required: ["doctorId", "patientId", "datetime"],
    },
    handler: async (params: {
      doctorId: number;
      patientId: number;
      datetime: string;
      duration?: number;
      reason?: string;
    }) => {
      const appointment = await createAppointment(
        params.doctorId,
        params.patientId,
        params.datetime,
        params.reason,
        params.duration
      );
      return { appointment, message: "Appointment booked successfully" };
    },
  },

  updateEvent: {
    name: "updateEvent",
    description: "Reschedule an existing appointment to a new date and time.",
    parameters: {
      type: "object",
      properties: {
        appointmentId: { type: "number", description: "The appointment ID" },
        newDatetime: {
          type: "string",
          description: "New datetime in ISO format",
        },
      },
      required: ["appointmentId", "newDatetime"],
    },
    handler: async (params: {
      appointmentId: number;
      newDatetime: string;
    }) => {
      const appointment = await rescheduleAppointment(
        params.appointmentId,
        params.newDatetime
      );
      if (!appointment) {
        return { error: "Appointment not found or already cancelled" };
      }
      return { appointment, message: "Appointment rescheduled successfully" };
    },
  },

  deleteEvent: {
    name: "deleteEvent",
    description: "Cancel an existing appointment.",
    parameters: {
      type: "object",
      properties: {
        appointmentId: { type: "number", description: "The appointment ID" },
      },
      required: ["appointmentId"],
    },
    handler: async (params: { appointmentId: number }) => {
      const appointment = await cancelAppointment(params.appointmentId);
      if (!appointment) {
        return { error: "Appointment not found or already cancelled" };
      }
      return { appointment, message: "Appointment cancelled successfully" };
    },
  },

  getAppointment: {
    name: "getAppointment",
    description: "Get details of a specific appointment by ID.",
    parameters: {
      type: "object",
      properties: {
        appointmentId: { type: "number", description: "The appointment ID" },
      },
      required: ["appointmentId"],
    },
    handler: async (params: { appointmentId: number }) => {
      const appointment = await getAppointmentById(params.appointmentId);
      if (!appointment) {
        return { error: "Appointment not found" };
      }
      return { appointment };
    },
  },
};
