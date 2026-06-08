import postgres from "postgres";
import { readFileSync } from "fs";

const PROJECT_REF = "tegvtxpwwpbefaqqizyd";
const PASSWORD = process.env.SUPABASE_DB_PASSWORD || process.env.SUPABASE_SERVICE_ROLE_KEY;
const sql = readFileSync("supabase/combined_migration.sql", "utf8");

const hosts = [
  `db.${PROJECT_REF}.supabase.co`,
  `aws-0-eu-central-1.pooler.supabase.com`,
  `aws-0-eu-west-1.pooler.supabase.com`,
  `aws-0-eu-west-2.pooler.supabase.com`,
];

const configs = [];
for (const host of hosts) {
  configs.push({
    host,
    port: host.includes("pooler") ? 6543 : 5432,
    user: host.includes("pooler") ? `postgres.${PROJECT_REF}` : "postgres",
  });
}

for (const cfg of configs) {
  const url = `postgresql://${cfg.user}:${encodeURIComponent(PASSWORD)}@${cfg.host}:${cfg.port}/postgres`;
  console.log(`Trying ${cfg.host}:${cfg.port}...`);
  try {
    const sqlClient = postgres(url, {
      ssl: "require",
      connect_timeout: 10,
      connection: { application_name: "rinu-migration" },
      target_session_attrs: "any",
    });
    await sqlClient.unsafe(sql);
    await sqlClient.end();
    console.log("Migration succeeded!");
    process.exit(0);
  } catch (err) {
    console.log(`  Failed: ${err.message?.slice(0, 120)}`);
  }
}

console.error("All connection attempts failed. Need database password from Supabase dashboard.");
process.exit(1);
