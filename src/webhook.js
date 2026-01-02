import crypto from "crypto";
import { db } from "./db.js";
import { runAgent } from "./agent.js";

export async function handleWebhook(body) {
  // Payload de teste:
  // POST /webhook
  // { "test_message": "...", "user_id":"u1", "platform":"test" }

  if (!body?.test_message) return;

  const userId = body.user_id || "test-user";
  const platform = body.platform || "test";
  const text = body.test_message;

  const inboundId = hash(`${userId}:${Date.now()}:${text}`);

  // salva mensagem inbound
  db.prepare(`
    INSERT INTO messages (id, user_id, platform, direction, text, status, raw_json)
    VALUES (?, ?, ?, 'inbound', ?, 'unprocessed', ?)
  `).run(inboundId, userId, platform, text, JSON.stringify(body));

  // roda agente
  const result = await runAgent({ text });

  const finalStatus =
    result.intent === "human_required" || !result.shouldAutoReply
      ? "forwarded"
      : "processed";

  // atualiza registro inbound com resultado do agente
  db.prepare(`
    UPDATE messages
    SET intent=?, ai_response=?, status=?
    WHERE id=?
  `).run(result.intent, result.reply, finalStatus, inboundId);

  // salva mensagem outbound (pra aparecer no painel)
  const outboundId = hash(`${userId}:${Date.now()}:out`);
  db.prepare(`
    INSERT INTO messages (id, user_id, platform, direction, text, intent, status, raw_json)
    VALUES (?, ?, ?, 'outbound', ?, ?, 'processed', ?)
  `).run(
    outboundId,
    userId,
    platform,
    result.reply,
    result.intent,
    JSON.stringify({ generated: true })
  );
}

function hash(s) {
  return crypto.createHash("sha256").update(s).digest("hex").slice(0, 24);
}

