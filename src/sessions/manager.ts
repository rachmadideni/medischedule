import { v4 as uuidv4 } from "uuid";
import type { Session, Message } from "../types/index.js";

const sessions = new Map<string, Session>();

export function getOrCreateSession(sessionId?: string): Session {
  if (sessionId && sessions.has(sessionId)) {
    return sessions.get(sessionId)!;
  }

  const id = sessionId || `s_${uuidv4().slice(0, 8)}`;
  const session: Session = {
    id,
    history: [],
    context: {},
  };
  sessions.set(id, session);
  return session;
}

export function getSession(sessionId: string): Session | undefined {
  return sessions.get(sessionId);
}

export function addMessage(sessionId: string, role: "user" | "assistant", content: string): void {
  const session = sessions.get(sessionId);
  if (!session) return;

  session.history.push({
    role,
    content,
    timestamp: new Date().toISOString(),
  });
}

export function updateSessionContext(
  sessionId: string,
  context: Partial<Session["context"]>
): void {
  const session = sessions.get(sessionId);
  if (!session) return;
  session.context = { ...session.context, ...context };
}

export function setSessionPatient(sessionId: string, patientId: number): void {
  const session = sessions.get(sessionId);
  if (session) {
    session.patientId = patientId;
  }
}

export function deleteSession(sessionId: string): boolean {
  return sessions.delete(sessionId);
}

export function getSessionInfo(sessionId: string) {
  const session = sessions.get(sessionId);
  if (!session) return null;

  return {
    session_id: session.id,
    patient_id: session.patientId || null,
    message_count: session.history.length,
    history: session.history,
  };
}
