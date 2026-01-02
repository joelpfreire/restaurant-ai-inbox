import express from "express";
import dotenv from "dotenv";
import { initDb, db } from "./src/db.js";
import { handleWebhook } from "./src/webhook.js";

dotenv.config();

const app = express();
app.use(express.json({ limit: "2mb" }));
app.use(express.static("public"));

initDb();

app.get("/health", (req, res) => res.json({ ok: true }));

app.post("/webhook", async (req, res) => {
  try {
    await handleWebhook(req.body);
    res.sendStatus(200);
  } catch (e) {
    console.error("Webhook error:", e);
    res.sendStatus(500);
  }
});

function requireAdmin(req, res, next) {
  const token = req.headers["x-admin-token"];
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

app.get("/api/messages", requireAdmin, (req, res) => {
  const status = req.query.status || "all";
  let rows;

  if (status === "all") {
    rows = db.prepare("SELECT * FROM messages ORDER BY created_at DESC LIMIT 200").all();
  } else {
    rows = db
      .prepare("SELECT * FROM messages WHERE status=? ORDER BY created_at DESC LIMIT 200")
      .all(status);
  }

  res.json({ messages: rows });
});

app.post("/api/messages/:id/status", requireAdmin, (req, res) => {
  const id = req.params.id;
  const status = req.body.status || "processed";
  db.prepare("UPDATE messages SET status=? WHERE id=?").run(status, id);
  res.json({ ok: true });
});

app.get("/", (req, res) => {
  res.send("OK ✅ Use /admin.html or /health");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Running on port ${PORT}`));
