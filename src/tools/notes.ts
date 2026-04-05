import { query } from "../db/client.js";

export const notesTools = {
  addNote: {
    name: "addNote",
    description:
      "Store visit notes or reason for visit for a specific appointment.",
    parameters: {
      type: "object",
      properties: {
        appointmentId: { type: "number", description: "The appointment ID" },
        content: { type: "string", description: "The note content" },
      },
      required: ["appointmentId", "content"],
    },
    handler: async (params: { appointmentId: number; content: string }) => {
      await query(
        "UPDATE appointments SET reason = $1 WHERE id = $2",
        [params.content, params.appointmentId]
      );
      return { message: "Note added successfully", appointmentId: params.appointmentId };
    },
  },

  getNote: {
    name: "getNote",
    description: "Retrieve visit notes for a specific appointment.",
    parameters: {
      type: "object",
      properties: {
        appointmentId: { type: "number", description: "The appointment ID" },
      },
      required: ["appointmentId"],
    },
    handler: async (params: { appointmentId: number }) => {
      const result = await query(
        "SELECT id, reason, doctor_id, patient_id, datetime FROM appointments WHERE id = $1",
        [params.appointmentId]
      );
      if (result.rows.length === 0) {
        return { error: "Appointment not found" };
      }
      return { appointment: result.rows[0], notes: result.rows[0].reason };
    },
  },

  getPatientNotes: {
    name: "getPatientNotes",
    description: "Get all visit notes for a patient across all appointments.",
    parameters: {
      type: "object",
      properties: {
        patientId: { type: "number", description: "The patient's ID" },
      },
      required: ["patientId"],
    },
    handler: async (params: { patientId: number }) => {
      const result = await query(
        `SELECT a.id, a.reason, a.datetime, a.status, d.name as doctor_name, d.specialty
         FROM appointments a
         JOIN doctors d ON d.id = a.doctor_id
         WHERE a.patient_id = $1 AND a.reason IS NOT NULL
         ORDER BY a.datetime DESC`,
        [params.patientId]
      );
      return { notes: result.rows, count: result.rows.length };
    },
  },
};
