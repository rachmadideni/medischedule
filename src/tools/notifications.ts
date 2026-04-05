import { createNotification } from "../db/queries.js";
import { query } from "../db/client.js";

export const notificationTools = {
  sendConfirmation: {
    name: "sendConfirmation",
    description:
      "Send a simulated booking confirmation notification to the patient. Logs the notification to the database.",
    parameters: {
      type: "object",
      properties: {
        patientId: { type: "number", description: "The patient's ID" },
        appointmentId: { type: "number", description: "The appointment ID" },
      },
      required: ["patientId", "appointmentId"],
    },
    handler: async (params: { patientId: number; appointmentId: number }) => {
      // Build a confirmation message from appointment details
      const apptResult = await query(
        `SELECT a.datetime, a.duration, d.name as doctor_name, d.specialty, p.email
         FROM appointments a
         JOIN doctors d ON d.id = a.doctor_id
         JOIN patients p ON p.id = a.patient_id
         WHERE a.id = $1`,
        [params.appointmentId]
      );

      if (apptResult.rows.length === 0) {
        return { error: "Appointment not found" };
      }

      const appt = apptResult.rows[0];
      const message = `Your appointment with ${appt.doctor_name} (${appt.specialty}) is confirmed for ${new Date(appt.datetime).toLocaleString()}. Duration: ${appt.duration} minutes.`;

      const notification = await createNotification(
        params.patientId,
        params.appointmentId,
        "confirmation",
        message
      );

      return {
        notification,
        message: `Confirmation sent to ${appt.email || "patient"} (simulated)`,
      };
    },
  },

  sendReminder: {
    name: "sendReminder",
    description:
      "Send a simulated appointment reminder notification to the patient.",
    parameters: {
      type: "object",
      properties: {
        patientId: { type: "number", description: "The patient's ID" },
        appointmentId: { type: "number", description: "The appointment ID" },
      },
      required: ["patientId", "appointmentId"],
    },
    handler: async (params: { patientId: number; appointmentId: number }) => {
      const apptResult = await query(
        `SELECT a.datetime, d.name as doctor_name, p.email
         FROM appointments a
         JOIN doctors d ON d.id = a.doctor_id
         JOIN patients p ON p.id = a.patient_id
         WHERE a.id = $1`,
        [params.appointmentId]
      );

      if (apptResult.rows.length === 0) {
        return { error: "Appointment not found" };
      }

      const appt = apptResult.rows[0];
      const message = `Reminder: You have an appointment with ${appt.doctor_name} on ${new Date(appt.datetime).toLocaleString()}.`;

      const notification = await createNotification(
        params.patientId,
        params.appointmentId,
        "reminder",
        message
      );

      return {
        notification,
        message: `Reminder sent to ${appt.email || "patient"} (simulated)`,
      };
    },
  },

  sendCancellation: {
    name: "sendCancellation",
    description:
      "Send a simulated cancellation notification to the patient.",
    parameters: {
      type: "object",
      properties: {
        patientId: { type: "number", description: "The patient's ID" },
        appointmentId: { type: "number", description: "The appointment ID" },
      },
      required: ["patientId", "appointmentId"],
    },
    handler: async (params: { patientId: number; appointmentId: number }) => {
      const apptResult = await query(
        `SELECT a.datetime, d.name as doctor_name, p.email
         FROM appointments a
         JOIN doctors d ON d.id = a.doctor_id
         JOIN patients p ON p.id = a.patient_id
         WHERE a.id = $1`,
        [params.appointmentId]
      );

      if (apptResult.rows.length === 0) {
        return { error: "Appointment not found" };
      }

      const appt = apptResult.rows[0];
      const message = `Your appointment with ${appt.doctor_name} on ${new Date(appt.datetime).toLocaleString()} has been cancelled.`;

      const notification = await createNotification(
        params.patientId,
        params.appointmentId,
        "cancellation",
        message
      );

      return {
        notification,
        message: `Cancellation notice sent to ${appt.email || "patient"} (simulated)`,
      };
    },
  },
};
