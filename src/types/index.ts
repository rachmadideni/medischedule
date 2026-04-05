export interface Doctor {
  id: number;
  name: string;
  specialty: string;
  bio: string | null;
  email: string | null;
  similarity?: number;
}

export interface Schedule {
  id: number;
  doctor_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export interface Patient {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  created_at: Date;
}

export interface Appointment {
  id: number;
  doctor_id: number;
  patient_id: number;
  datetime: Date;
  duration: number;
  status: "confirmed" | "cancelled" | "completed";
  reason: string | null;
  created_at: Date;
  // Joined fields
  doctor_name?: string;
  doctor_specialty?: string;
}

export interface Notification {
  id: number;
  patient_id: number;
  appointment_id: number;
  type: "confirmation" | "reminder" | "cancellation";
  channel: string;
  message: string;
  status: string;
  created_at: Date;
}

export interface TimeSlot {
  date: string;
  start_time: string;
  end_time: string;
  doctor_id: number;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface Session {
  id: string;
  history: Message[];
  patientId?: number;
  context: {
    pendingDoctors?: Doctor[];
    pendingSlots?: TimeSlot[];
    pendingAction?: string;
  };
}

export interface ChatRequest {
  session_id?: string;
  message: string;
}

export interface ChatResponse {
  session_id: string;
  response: string;
  metadata: {
    agent_used: string;
    actions_taken: string[];
  };
}
