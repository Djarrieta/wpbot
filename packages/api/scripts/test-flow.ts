import pg from "pg";

const client = new pg.Client("postgresql://wpbot:wpbot@localhost:4003/wpbot");
await client.connect();

try {
  // Simulate what resolveByIdentity does
  console.log("1. Looking for identity...");
  const r1 = await client.query(
    "SELECT u.* FROM users u JOIN user_identities ui ON ui.user_id = u.id WHERE ui.provider = $1 AND ui.provider_id = $2",
    ["telegram", "99999"]
  );
  console.log("  Found:", r1.rows.length);

  console.log("2. Creating user...");
  const r2 = await client.query(
    "INSERT INTO users (name, email, phone) VALUES ($1, $2, $3) RETURNING *",
    ["TestBot", "", ""]
  );
  console.log("  Created user:", r2.rows[0]);

  const userId = r2.rows[0].id;
  console.log("3. Adding identity...");
  await client.query(
    "INSERT INTO user_identities (user_id, provider, provider_id) VALUES ($1, $2, $3) ON CONFLICT (provider, provider_id) DO NOTHING",
    [userId, "telegram", "99999"]
  );
  console.log("  Identity added");

  console.log("4. Adding chat message...");
  await client.query(
    "INSERT INTO chat_history (user_id, message, role, timestamp) VALUES ($1, $2, $3, $4) RETURNING *",
    [userId, "hola", "user", new Date().toISOString()]
  );
  console.log("  Message saved");

  // Cleanup
  await client.query("DELETE FROM chat_history WHERE user_id = $1", [userId]);
  await client.query("DELETE FROM user_identities WHERE user_id = $1", [userId]);
  await client.query("DELETE FROM users WHERE id = $1", [userId]);
  console.log("\nAll operations succeeded! DB layer is fine.");
  console.log("The error is likely in the AI service (LLM API call).");
} catch (err) {
  console.error("ERROR:", err);
} finally {
  await client.end();
}
