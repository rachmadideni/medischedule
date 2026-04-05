import { query } from "./client.js";
import type {
  Doctor,
  Patient,
  Appointment,
  Schedule,
  TimeSlot,
  Notification,
} from "../types/index.js";

// ── Doctor Queries ──

export async function searchDoctorsBySymptom(
  symptomDescription: string,
  limit = 5
): Promise<Doctor[]> {
  const result = await query<Doctor>(
    `SELECT id, name, specialty, bio, email,
            1 - (embedding <=> embedding('text-embedding-005', $1)::vector) AS similarity
     FROM doctors
     WHERE embedding IS NOT NULL
     ORDER BY embedding <=> embedding('text-embedding-005', $1)::vector
     LIMIT $2`,
    [symptomDescription, limit]
  );
  return result.rows;
}

export async function searchDoctorsBySpecialty(
  specialty: string
): Promise<Doctor[]> {
  const result = await query<Doctor>(
    `SELECT id, name, specialty, bio, email
     FROM doctors
     WHERE LOWER(specialty) = LOWER($1)`,
    [specialty]
  );
  return result.rows;
}

export async function getDoctorById(id: number): Promise<Doctor | null> {
  const result = await query<Doctor>(
    "SELECT id, name, specialty, bio, email FROM doctors WHERE id = $1",
    [id]
  );
  return result.rows[0] || null;
}

// ── Schedule Queries ──

export async function getDoctorSchedules(
  doctorId: number
): Promise<Schedule[]> {
  const result = await query<Schedule>(
    "SELECT id, doctor_id, day_of_week, start_time::text, end_time::text FROM schedules WHERE doctor_id = $1 ORDER BY day_of_week, start_time",
    [doctorId]
  );
  return result.rows;
}

export async function getAvailableSlots(
  doctorId: number,
  startDate: string,
  endDate: string
): Promise<TimeSlot[]> {
  // Get the doctor's weekly schedule
  const schedules = await getDoctorSchedules(doctorId);

  // Get existing appointments in the date range
  const existingAppts = await query<Appointment>(
    `SELECT datetime, duration FROM appointments
     WHERE doctor_id = $1 AND status = 'confirmed'
     AND datetime >= $2::timestamp AND datetime < $3::timestamp + interval '1 day'`,
    [doctorId, startDate, endDate]
  );

  const bookedTimes = new Set(
    existingAppts.rows.map((a) => new Date(a.datetime).toISOString())
  );

  // Generate available 30-min slots
  const slots: TimeSlot[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay();
    const daySchedules = schedules.filter((s) => s.day_of_week === dayOfWeek);

    for (const sched of daySchedules) {
      const [startH, startM] = sched.start_time.split(":").map(Number);
      const [endH, endM] = sched.end_time.split(":").map(Number);

      const slotStart = new Date(d);
      slotStart.setHours(startH, startM, 0, 0);

      const schedEnd = new Date(d);
      schedEnd.setHours(endH, endM, 0, 0);

      while (slotStart.getTime() + 30 * 60000 <= schedEnd.getTime()) {
        if (!bookedTimes.has(slotStart.toISOString())) {
          const slotEnd = new Date(slotStart.getTime() + 30 * 60000);
          slots.push({
            date: d.toISOString().split("T")[0],
            start_time: slotStart.toTimeString().slice(0, 5),
            end_time: slotEnd.toTimeString().slice(0, 5),
            doctor_id: doctorId,
          });
        }
        slotStart.setMinutes(slotStart.getMinutes() + 30);
      }
    }
  }

  return slots;
}

// ── Patient Queries ──

export async function createPatient(
  name: string,
  email?: string,
  phone?: string
): Promise<Patient> {
  const result = await query<Patient>(
    `INSERT INTO patients (name, email, phone)
     VALUES ($1, $2, $3)
     RETURNING id, name, email, phone, created_at`,
    [name, email || null, phone || null]
  );
  return result.rows[0];
}

export async function getPatientByEmail(
  email: string
): Promise<Patient | null> {
  const result = await query<Patient>(
    "SELECT id, name, email, phone, created_at FROM patients WHERE email = $1",
    [email]
  );
  return result.rows[0] || null;
}

export async function getPatientById(id: number): Promise<Patient | null> {
  const result = await query<Patient>(
    "SELECT id, name, email, phone, created_at FROM patients WHERE id = $1",
    [id]
  );
  return result.rows[0] || null;
}

export async function updatePatient(
  id: number,
  updates: { name?: string; email?: string; phone?: string }
): Promise<Patient | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (updates.name) {
    fields.push(`name = $${idx++}`);
    values.push(updates.name);
  }
  if (updates.email) {
    fields.push(`email = $${idx++}`);
    values.push(updates.email);
  }
  if (updates.phone) {
    fields.push(`phone = $${idx++}`);
    values.push(updates.phone);
  }

  if (fields.length === 0) return getPatientById(id);

  values.push(id);
  const result = await query<Patient>(
    `UPDATE patients SET ${fields.join(", ")} WHERE id = $${idx}
     RETURNING id, name, email, phone, created_at`,
    values
  );
  return result.rows[0] || null;
}

// ── Appointment Queries ──

export async function createAppointment(
  doctorId: number,
  patientId: number,
  datetime: string,
  reason?: string,
  duration = 30
): Promise<Appointment> {
  const result = await query<Appointment>(
    `INSERT INTO appointments (doctor_id, patient_id, datetime, duration, reason)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, doctor_id, patient_id, datetime, duration, status, reason, created_at`,
    [doctorId, patientId, datetime, duration, reason || null]
  );
  return result.rows[0];
}

export async function rescheduleAppointment(
  appointmentId: number,
  newDatetime: string
): Promise<Appointment | null> {
  const result = await query<Appointment>(
    `UPDATE appointments SET datetime = $1
     WHERE id = $2 AND status = 'confirmed'
     RETURNING id, doctor_id, patient_id, datetime, duration, status, reason, created_at`,
    [newDatetime, appointmentId]
  );
  return result.rows[0] || null;
}

export async function cancelAppointment(
  appointmentId: number
): Promise<Appointment | null> {
  const result = await query<Appointment>(
    `UPDATE appointments SET status = 'cancelled'
     WHERE id = $1 AND status = 'confirmed'
     RETURNING id, doctor_id, patient_id, datetime, duration, status, reason, created_at`,
    [appointmentId]
  );
  return result.rows[0] || null;
}

export async function getPatientAppointments(
  patientId: number
): Promise<Appointment[]> {
  const result = await query<Appointment>(
    `SELECT a.id, a.doctor_id, a.patient_id, a.datetime, a.duration, a.status, a.reason, a.created_at,
            d.name as doctor_name, d.specialty as doctor_specialty
     FROM appointments a
     JOIN doctors d ON d.id = a.doctor_id
     WHERE a.patient_id = $1 AND a.status = 'confirmed' AND a.datetime >= NOW()
     ORDER BY a.datetime`,
    [patientId]
  );
  return result.rows;
}

export async function getAppointmentById(
  id: number
): Promise<Appointment | null> {
  const result = await query<Appointment>(
    `SELECT a.id, a.doctor_id, a.patient_id, a.datetime, a.duration, a.status, a.reason, a.created_at,
            d.name as doctor_name, d.specialty as doctor_specialty
     FROM appointments a
     JOIN doctors d ON d.id = a.doctor_id
     WHERE a.id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

// ── Notification Queries ──

export async function createNotification(
  patientId: number,
  appointmentId: number,
  type: "confirmation" | "reminder" | "cancellation",
  message: string
): Promise<Notification> {
  const result = await query<Notification>(
    `INSERT INTO notifications (patient_id, appointment_id, type, channel, message, status)
     VALUES ($1, $2, $3, 'email', $4, 'simulated')
     RETURNING *`,
    [patientId, appointmentId, type, message]
  );
  return result.rows[0];
}

