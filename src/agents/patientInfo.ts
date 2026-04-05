import { LlmAgent, FunctionTool } from "@google/adk";
import { z } from "zod";
import {
  createPatient,
  getPatientByEmail,
  getPatientById,
  updatePatient,
} from "../db/queries.js";
import { query } from "../db/client.js";

const createPatientTool = new FunctionTool({
  name: "createPatient",
  description:
    "Register a new patient. Requires name, optionally email and phone. Check if the patient already exists by email before creating.",
  parameters: z.object({
    name: z.string().describe("Patient's full name"),
    email: z.string().optional().describe("Patient's email address"),
    phone: z.string().optional().describe("Patient's phone number"),
  }),
  execute: async (params) => {
    // Check if patient already exists by email
    if (params.email) {
      const existing = await getPatientByEmail(params.email);
      if (existing) {
        return {
          patient: existing,
          message: "Patient already exists with this email",
          isExisting: true,
        };
      }
    }

    const patient = await createPatient(
      params.name,
      params.email,
      params.phone
    );
    return { patient, message: "Patient registered successfully", isExisting: false };
  },
});

const getPatientTool = new FunctionTool({
  name: "getPatient",
  description: "Look up a patient by their ID or email address.",
  parameters: z.object({
    patientId: z.number().optional().describe("The patient's ID"),
    email: z.string().optional().describe("The patient's email"),
  }),
  execute: async (params) => {
    let patient = null;
    if (params.patientId) {
      patient = await getPatientById(params.patientId);
    } else if (params.email) {
      patient = await getPatientByEmail(params.email);
    }

    if (!patient) {
      return { error: "Patient not found" };
    }
    return { patient };
  },
});

const updatePatientTool = new FunctionTool({
  name: "updatePatient",
  description: "Update an existing patient's details (name, email, or phone).",
  parameters: z.object({
    patientId: z.number().describe("The patient's ID"),
    name: z.string().optional().describe("New name"),
    email: z.string().optional().describe("New email"),
    phone: z.string().optional().describe("New phone number"),
  }),
  execute: async (params) => {
    const { patientId, ...updates } = params;
    const patient = await updatePatient(patientId, updates);
    if (!patient) {
      return { error: "Patient not found" };
    }
    return { patient, message: "Patient updated successfully" };
  },
});

const addVisitNotesTool = new FunctionTool({
  name: "addVisitNotes",
  description:
    "Add pre-visit notes or reason for visit to a specific appointment.",
  parameters: z.object({
    appointmentId: z.number().describe("The appointment ID"),
    content: z.string().describe("The visit notes content"),
  }),
  execute: async (params) => {
    await query("UPDATE appointments SET reason = $1 WHERE id = $2", [
      params.content,
      params.appointmentId,
    ]);
    return {
      message: "Visit notes added successfully",
      appointmentId: params.appointmentId,
    };
  },
});

export const patientInfoAgent = new LlmAgent({
  name: "patient_info",
  description:
    "Manages patient profiles and visit information. Use this agent when the user needs to register, update their profile, or add visit notes.",
  model: "gemini-2.0-flash-001",
  instruction: `You are the Patient Info Agent. You manage patient profiles and visit information.

You have access to these tools:
- createPatient: Register a new patient. Requires name, optionally email and phone.
- getPatient: Look up a patient by ID or email.
- updatePatient: Update an existing patient's details.
- addVisitNotes: Add pre-visit notes or reason for visit to an appointment.

Rules:
- Before creating a new patient, always check if they already exist by email
- Always confirm patient details back after creating or updating
- Keep visit notes concise and relevant`,
  tools: [createPatientTool, getPatientTool, updatePatientTool, addVisitNotesTool],
});
