import dns from "node:dns";
import { MongoClient } from "mongodb";

// Override Windows' DNS resolver before the MongoDB client is created.
dns.setServers(["8.8.8.8", "1.1.1.1"]);

let client: MongoClient | undefined;

export async function getDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not configured.");
  client ??= new MongoClient(uri);
  await client.connect();
  return client.db(process.env.MONGODB_DB ?? "spendly");
}
