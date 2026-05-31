import "dotenv/config";
import app, { db, logger } from "./app";
import { HEALTH_CHECK_INTERVAL_MS } from "./Domain/constants/Constants";

const PORT = parseInt(process.env.PORT ?? "4000", 10);

async function start(): Promise<void> {
  await db.startHealthCheck(HEALTH_CHECK_INTERVAL_MS);

  app.listen(PORT, () => {
    logger.info("Server", `Running at http://localhost:${PORT}/api/v1`);
  });
}

start().catch((err) => logger.error("Server", "Fatal startup error", err));
