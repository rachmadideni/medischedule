import express from "express";
import dotenv from "dotenv";
import { Runner, InMemorySessionService } from "@google/adk";
import { orchestratorAgent } from "./agents/orchestrator.js";
import {
  getOrCreateSession,
  addMessage,
  getSessionInfo,
  deleteSession,
} from "./sessions/manager.js";

dotenv.config();

const app = express();
app.use(express.json());

// ADK session service and runner
const sessionService = new InMemorySessionService();
const runner = new Runner({
  agent: orchestratorAgent,
  appName: "medischedule-ai",
  sessionService,
});

// ── Health Check ──

app.get("/health", (_req, res) => {
  res.json({ status: "ok", version: "1.0.0" });
});

// ── Chat Endpoint ──

app.post("/chat", async (req, res) => {
  try {
    const { session_id, message } = req.body;

    if (!message || typeof message !== "string") {
      res.status(400).json({ error: "Missing or invalid 'message' field" });
      return;
    }

    // Get or create our local session for tracking
    const localSession = getOrCreateSession(session_id);

    // Get or create ADK session
    let adkSession = await sessionService.getSession({
      appName: "medischedule-ai",
      userId: "default-user",
      sessionId: localSession.id,
    });

    if (!adkSession) {
      adkSession = await sessionService.createSession({
        appName: "medischedule-ai",
        userId: "default-user",
        sessionId: localSession.id,
      });
    }

    // Track user message
    addMessage(localSession.id, "user", message);

    // Run the agent
    let responseText = "";
    let agentUsed = "orchestrator";
    const actionsTaken: string[] = [];

    const result = runner.runAsync({
      userId: "default-user",
      sessionId: adkSession.id,
      newMessage: {
        role: "user",
        parts: [{ text: message }],
      },
    });

    for await (const event of result) {
      console.log("ADK Event:", JSON.stringify(event, null, 2));

      // Collect the final response text
      if (event.content?.parts) {
        for (const part of event.content.parts) {
          if (part.text) {
            responseText += part.text;
          }
          if (part.functionCall) {
            actionsTaken.push(part.functionCall.name ?? "unknown");
          }
        }
      }

      // Track which agent handled it
      if (event.author && event.author !== "orchestrator") {
        agentUsed = event.author;
      }
    }

    // Track assistant response
    addMessage(localSession.id, "assistant", responseText);

    res.json({
      session_id: localSession.id,
      response: responseText,
      metadata: {
        agent_used: agentUsed,
        actions_taken: actionsTaken,
      },
    });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// ── Session Endpoints ──

app.get("/sessions/:sessionId", (req, res) => {
  const info = getSessionInfo(req.params.sessionId);
  if (!info) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  res.json(info);
});

app.delete("/sessions/:sessionId", (req, res) => {
  deleteSession(req.params.sessionId);
  res.status(204).send();
});

// ── Start Server ──

const PORT = parseInt(process.env.PORT || "8080");

app.listen(PORT, () => {
  console.log(`MediSchedule AI running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
