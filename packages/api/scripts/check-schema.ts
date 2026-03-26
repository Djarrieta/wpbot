import pg from "pg";

const client = new pg.Client("postgresql://wpbot:wpbot@localhost:4003/wpbot");
await client.connect();

const r1 = await client.query(
  "SELECT column_name FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position"
);
console.log("users columns:", r1.rows.map((r: any) => r.column_name));

const r2 = await client.query(
  "SELECT table_name FROM information_schema.tables WHERE table_name = 'user_identities'"
);
console.log("user_identities exists:", r2.rows.length > 0);

await client.end();
