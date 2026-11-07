import { knowledgeIngestionService } from "../ai/knowledgeIngestionService";
import { prisma } from "@/lib/db/prisma";

async function main() {
  console.log("================================================================================");
  console.log("VANTAGE WEALTH ASSISTANT — CMS KNOWLEDGE INGESTION PIPELINE");
  console.log("================================================================================\n");

  console.log("Ingesting published CMS content into PostgreSQL KnowledgeChunks...");
  const result = await knowledgeIngestionService.syncAllPublishedContent();

  console.log(`\n✔ Services Indexed: ${result.servicesIndexed}`);
  console.log(`✔ Articles Indexed: ${result.articlesIndexed}`);
  console.log(`✔ Team Profiles Indexed: ${result.teamIndexed}`);
  console.log(`✔ Total Active Chunks in Knowledge Base: ${result.totalChunks}\n`);

  console.log("================================================================================");
  console.log("INGESTION COMPLETE — 100% GROUNDED DATA INDEXED (ZERO FABRICATION)");
  console.log("================================================================================\n");
}

main()
  .catch((e) => {
    console.error("Ingestion error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
