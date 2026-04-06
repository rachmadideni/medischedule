import { LlmAgent } from "@google/adk";
import { z } from "zod";
import { FunctionTool } from "@google/adk";
import {
  searchDoctorsBySymptom,
  searchDoctorsBySpecialty,
  getAvailableSlots,
} from "../db/queries.js";

const searchDoctorsBySymptomTool = new FunctionTool({
  name: "searchDoctorsBySymptom",
  description:
    "Search for doctors whose specialty matches the patient's symptoms using vector similarity. Use this when the patient describes symptoms or health concerns.",
  parameters: z.object({
    symptomDescription: z
      .string()
      .describe("The patient's symptom description in natural language"),
    limit: z
      .number()
      .optional()
      .default(5)
      .describe("Max number of results"),
  }),
  execute: async (params) => {
    const doctors = await searchDoctorsBySymptom(params.symptomDescription, params.limit);
    return { doctors, count: doctors.length };
  },
});

const searchDoctorsBySpecialtyTool = new FunctionTool({
  name: "searchDoctorsBySpecialty",
  description:
    "Search for doctors by exact specialty name. Use this when the patient asks for a specific type of doctor (e.g., cardiologist, dermatologist).",
  parameters: z.object({
    specialty: z
      .string()
      .describe(
        "The medical specialty (e.g., Neurology, Cardiology, General Practice)"
      ),
  }),
  execute: async (params) => {
    const doctors = await searchDoctorsBySpecialty(params.specialty);
    return { doctors, count: doctors.length };
  },
});

const getAvailableSlotsTool = new FunctionTool({
  name: "getAvailableSlots",
  description:
    "Get available appointment slots for a specific doctor within a date range. Always call this after finding matching doctors to show available times.",
  parameters: z.object({
    doctorId: z.number().describe("The doctor's ID"),
    startDate: z.string().describe("Start date in YYYY-MM-DD format"),
    endDate: z.string().describe("End date in YYYY-MM-DD format"),
  }),
  execute: async (params) => {
    const slots = await getAvailableSlots(
      params.doctorId,
      params.startDate,
      params.endDate
    );
    return { slots, count: slots.length };
  },
});

export const doctorLookupAgent = new LlmAgent({
  name: "doctor_lookup",
  description:
    "Finds relevant doctors based on symptoms or specialty, and checks their availability. Use this agent when the user wants to find a doctor or describes symptoms.",
  model: "gemini-3-flash-preview",
  instruction: `You are the Doctor Lookup Agent. Your job is to help find the right doctor for a patient.

You have access to these tools:
- searchDoctorsBySymptom: Use when the patient describes symptoms. This performs a vector similarity search to find doctors whose specialty matches the symptoms.
- searchDoctorsBySpecialty: Use when the patient asks for a specific specialty (e.g., "I need a cardiologist").
- getAvailableSlots: Use to check when a specific doctor is available. Always call this after finding matching doctors.

Always return:
- Doctor name and specialty
- A brief description of why they're a good match
- Available time slots for the next 7 days

If no doctors match, suggest the patient try a General Practice doctor.
Use today's date as the start date for availability searches unless the patient specifies otherwise.`,
  tools: [
    searchDoctorsBySymptomTool,
    searchDoctorsBySpecialtyTool,
    getAvailableSlotsTool,
  ],
});
