import express from "express";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import cors from "cors";

// Middleware imports
import {
  security,
  rateLimiter,
  authRateLimit,
  corsOptions,
  logger,
  devLogger,
} from "./middleware/security.js";

// Route imports
import authRoutes from "./routes/auth.routes.js";
import companyRoutes from "./routes/company.routes.js";
import deviceRoutes from "./routes/device.routes.js";
import locationRoutes from "./routes/location.routes.js";
import geofenceRoutes from "./routes/geofence.routes.js";
import alertRoutes from "./routes/alert.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";

// Swagger configuration
import { specs, swaggerUi } from "./config/swagger.js";

// Queue import
import { publishCommand } from "./queue.js";

dotenv.config();
const app = express();
const prisma = new PrismaClient();

// Security middleware
app.use(security);
app.use(cors(corsOptions));

// Logging
if (process.env.NODE_ENV === "production") {
  app.use(logger);
} else {
  app.use(devLogger);
}

// Rate limiting
app.use(rateLimiter);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check
app.get("/health", (_req, res) =>
  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  })
);

// Swagger Documentation
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(specs, {
    explorer: true,
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "TrakSure API Documentation",
    swaggerOptions: {
      persistAuthorization: true,
    },
  })
);

// API Routes
app.use("/auth", authRateLimit, authRoutes);
app.use("/companies", companyRoutes);
app.use("/devices", deviceRoutes);
app.use("/locations", locationRoutes);
app.use("/geofences", geofenceRoutes);
app.use("/alerts", alertRoutes);
app.use("/dashboard", dashboardRoutes);

// Legacy endpoints for backward compatibility
app.get("/devices", async (_req, res) => {
  try {
    const devices =
      await prisma.$queryRaw`SELECT * FROM devices ORDER BY created_at DESC LIMIT 100;`;
    res.json(devices);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "erro ao buscar devices" });
  }
});

app.post("/locations", async (req, res) => {
  const {
    device_id,
    latitude,
    longitude,
    speed = null,
    heading = null,
    raw_payload = null,
  } = req.body;
  if (!device_id || latitude == null || longitude == null) {
    return res
      .status(400)
      .json({ error: "device_id, latitude e longitude são obrigatórios" });
  }

  try {
    await prisma.$executeRaw`
      INSERT INTO locations (device_id, latitude, longitude, recorded_at, geom, speed, heading, raw_payload)
      VALUES (${device_id}::uuid, ${latitude}::double precision, ${longitude}::double precision, now(),
              ST_SetSRID(ST_MakePoint(${longitude}::double precision, ${latitude}::double precision), 4326),
              ${speed}::double precision, ${heading}::double precision, ${raw_payload}::jsonb);
    `;

    // Update device last_seen
    await prisma.devices.update({
      where: { id: device_id },
      data: { last_seen: new Date() },
    });

    res.status(201).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "erro ao inserir location" });
  }
});

app.post("/commands", async (req, res) => {
  const { device_id, command_type, payload = {} } = req.body;
  if (!device_id || !command_type) {
    return res
      .status(400)
      .json({ error: "device_id e command_type obrigatórios" });
  }

  try {
    const inserted: any = await prisma.$queryRaw`
      INSERT INTO commands (device_id, command_type, payload, status, created_at)
      VALUES (${device_id}::uuid, ${command_type}, ${JSON.stringify(
      payload
    )}::jsonb, 'pending', now())
      RETURNING id, created_at;
    `;
    const cmd = inserted[0] || inserted;

    await publishCommand({ id: cmd.id, device_id, command_type, payload });

    await prisma.$queryRaw`
      UPDATE commands SET status = 'sent', sent_at = now() WHERE id = ${cmd.id}::uuid;
    `;

    res.status(201).json({ ok: true, id: cmd.id });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "erro ao criar command", detail: String(err) });
  }
});

app.get("/commands/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const rows: any =
      await prisma.$queryRaw`SELECT * FROM commands WHERE id = ${id}::uuid;`;
    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: "erro ao buscar command" });
  }
});

// Error handling middleware
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).json({
      success: false,
      error:
        process.env.NODE_ENV === "production"
          ? "Internal server error"
          : err.message,
    });
  }
);

// 404 handler
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
  });
});

const port = Number(process.env.PORT) || 3000;

app.listen(port, () => {
  console.log(`🚀 TrakSure API listening on port ${port}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 Health check: http://localhost:${port}/health`);
  console.log(`📚 API Docs: http://localhost:${port}/api-docs`);
});
