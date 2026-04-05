import { LlmAgent, FunctionTool } from "@google/adk";
import { z } from "zod";
import {
  createAppointment,
  rescheduleAppointment,
  cancelAppointment,
  getPatientAppointments,
  getAppointmentById,
  createNotification,
  getDoctorById,
  getPatientById,
} from "../db/queries.js";

const createAppointmentTool = new FunctionTool({
  name: "createAppointment",
  description:
    "Book a new appointment for a patient with a doctor at a specific date and time.",
  parameters: z.object({
    doctorId: z.number().describe("The doctor's ID"),
    patientId: z.number().describe("The patient's ID"),
    datetime: z
      .string()
      .describe("Appointment datetime in ISO format (e.g., 2026-04-09T14:00:00)"),
    reason: z.string().optional().describe("Reason for the visit"),
    duration: z
      .number()
      .optional()
      .default(30)
      .describe("Duration in minutes"),
  }),
  execute: async (params) => {
    const appointment = await createAppointment(
      params.doctorId,
      params.patientId,
      params.datetime,
      params.reason,
      params.duration
    );
    return { appointment, message: "Appointment booked successfully" };
  },
});

const rescheduleAppointmentTool = new FunctionTool({
  name: "rescheduleAppointment",
  description: "Reschedule an existing appointment to a new date and time.",
  parameters: z.object({
    appointmentId: z.number().describe("The appointment ID to reschedule"),
    newDatetime: z
      .string()
      .describe("New datetime in ISO format (e.g., 2026-04-10T10:00:00)"),
  }),
  execute: async (params) => {
    const appointment = await rescheduleAppointment(
      params.appointmentId,
      params.newDatetime
    );
    if (!appointment) {
      return { error: "Appointment not found or already cancelled" };
    }
    return { appointment, message: "Appointment rescheduled successfully" };
  },
});

const cancelAppointmentTool = new FunctionTool({
  name: "cancelAppointment",
  description: "Cancel an existing confirmed appointment.",
  parameters: z.object({
    appointmentId: z.number().describe("The appointment ID to cancel"),
  }),
  execute: async (params) => {
    const appointment = await cancelAppointment(params.appointmentId);
    if (!appointment) {
      return { error: "Appointment not found or already cancelled" };
    }
    return { appointment, message: "Appointment cancelled successfully" };
  },
});

const getPatientAppointmentsTool = new FunctionTool({
  name: "getPatientAppointments",
  description:
    "Get all upcoming confirmed appointments for a patient. Returns doctor name, specialty, date/time, and reason.",
  parameters: z.object({
    patientId: z.number().describe("The patient's ID"),
  }),
  execute: async (params) => {
    const appointments = await getPatientAppointments(params.patientId);
    return { appointments, count: appointments.length };
  },
});

const sendConfirmationTool = new FunctionTool({
  name: "sendConfirmation",
  description:
    "Send a simulated confirmation/cancellation notification to the patient after booking, rescheduling, or cancelling. Always call this after a booking action.",
  parameters: z.object({
    patientId: z.number().describe("The patient's ID"),
    appointmentId: z.number().describe("The appointment ID"),
    type: z
      .enum(["confirmation", "reminder", "cancellation"])
      .describe("Type of notification"),
  }),
  execute: async (params) => {
    const appointment = await getAppointmentById(params.appointmentId);
    if (!appointment) {
      return { error: "Appointment not found" };
    }

    const doctor = await getDoctorById(appointment.doctor_id);
    const patient = await getPatientById(params.patientId);

    const messages: Record<string, string> = {
      confirmation: `Your appointment with ${doctor?.name} (${doctor?.specialty}) is confirmed for ${new Date(appointment.datetime).toLocaleString()}.`,
      reminder: `Reminder: You have an appointment with ${doctor?.name} on ${new Date(appointment.datetime).toLocaleString()}.`,
      cancellation: `Your appointment with ${doctor?.name} on ${new Date(appointment.datetime).toLocaleString()} has been cancelled.`,
    };

    const notification = await createNotification(
      params.patientId,
      params.appointmentId,
      params.type,
      messages[params.type]
    );

    return {
      notification,
      message: `${params.type} sent to ${patient?.email || "patient"} (simulated)`,
    };
  },
});

export const bookingAgent = new LlmAgent({
  name: "booking",
  description:
    "Manages appointment lifecycle: booking, rescheduling, cancelling, and listing appointments. Use this agent when the user wants to book, change, cancel, or view appointments.",
  model: "gemini-2.0-flash",
  instruction: `You are the Booking Agent. You manage appointment bookings for patients.

You have access to these tools:
- createAppointment: Book a new appointment. Requires doctorId, patientId, datetime, and optionally reason.
- rescheduleAppointment: Change the datetime of an existing appointment.
- cancelAppointment: Cancel an existing appointment.
- getPatientAppointments: List all upcoming appointments for a patient.
- sendConfirmation: Send a simulated notification after booking, rescheduling, or cancelling.

Rules:
- After booking or rescheduling, always call sendConfirmation with type "confirmation"
- After cancelling, always call sendConfirmation with type "cancellation"
- When listing appointments, show: doctor name, date/time, status, and reason
- If you don't have a patientId or doctorId, ask the orchestrator to get it first`,
  tools: [
    createAppointmentTool,
    rescheduleAppointmentTool,
    cancelAppointmentTool,
    getPatientAppointmentsTool,
    sendConfirmationTool,
  ],
});
