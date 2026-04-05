import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { getAllDoctors, updateDoctorEmbedding } from "../src/db/queries.js";

dotenv.config();

const genai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY! });

async function embedText(text: string): Promise<number[]> {
  const response = await genai.models.embedContent({
    model: "text-embedding-004",
    contents: text,
  });
  return response.embeddings?.[0]?.values ?? [];
}

async function main() {
  console.log("Fetching all doctors...");
  const doctors = await getAllDoctors();
  console.log(`Found ${doctors.length} doctors. Generating embeddings...`);

  for (const doctor of doctors) {
    const text = `${doctor.specialty} specialist. ${doctor.bio || ""}`;
    console.log(`  Embedding: ${doctor.name} (${doctor.specialty})`);

    const embedding = await embedText(text);
    await updateDoctorEmbedding(doctor.id, embedding);

    console.log(`  ✓ Done (${embedding.length} dimensions)`);
  }

  console.log("\nAll embeddings generated and saved.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error seeding embeddings:", err);
  process.exit(1);
});
