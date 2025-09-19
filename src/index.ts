import express from "express";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { publishCommand } from "./queue";

dotenv.config();
const app = express();
const prisma = new PrismaClient();
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.get("/devices", async (_req, res) => {
  try {
    const devices = await prisma.$queryRaw`SELECT * FROM devices ORDER BY created_at DESC LIMIT 100;`;
    res.json(devices);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "erro ao buscar devices" });
  }
});

app.post("/locations", async (req, res) => {
  const { device_id, latitude, longitude, speed = null, heading = null, raw_payload = null } = req.body;
  if (!device_id || latitude == null || longitude == null) return res.status(400).json({ error: "device_id, latitude e longitude são obrigatórios" });
  try {
    await prisma.$executeRaw`
      INSERT INTO locations (device_id, latitude, longitude, recorded_at, geom, speed, heading, raw_payload)
      VALUES (${device_id}::uuid, ${latitude}::double precision, ${longitude}::double precision, now(),
              ST_SetSRID(ST_MakePoint(${longitude}::double precision, ${latitude}::double precision), 4326),
              ${speed}::double precision, ${heading}::double precision, ${raw_payload}::jsonb);
    `;
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "erro ao inserir location" });
  }
});

app.post("/commands", async (req, res) => {
  const { device_id, command_type, payload = {} } = req.body;
  if (!device_id || !command_type) return res.status(400).json({ error: "device_id e command_type obrigatórios" });

  try {
    // inserir comando como pending
    const inserted: any = await prisma.$queryRaw`
      INSERT INTO commands (device_id, command_type, payload, status, created_at)
      VALUES (${device_id}::uuid, ${command_type}, ${JSON.stringify(payload)}::jsonb, 'pending', now())
      RETURNING id, created_at;
    `;
    const cmd = inserted[0] || inserted;

    // publicar na fila para o tcp-server processar
    await publishCommand({ id: cmd.id, device_id, command_type, payload });

    // marcar como sent (tentativa)
    await prisma.$queryRaw`
      UPDATE commands SET status = 'sent', sent_at = now() WHERE id = ${cmd.id}::uuid;
    `;

    res.status(201).json({ ok: true, id: cmd.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "erro ao criar command", detail: String(err) });
  }
});

app.get("/commands/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const rows: any = await prisma.$queryRaw`SELECT * FROM commands WHERE id = ${id}::uuid;`;
    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: "erro ao buscar command" });
  }
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`API listening on ${port}`));