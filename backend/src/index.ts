import { createApp } from "./app";
import { env } from "./config/env";
import { initDatabase } from "./config/database";

async function bootstrap() {
  await initDatabase();

  const app = createApp();
  app.listen(env.PORT, () => {
    console.log(`StepSafe backend listening on http://localhost:${env.PORT}`);
    console.log(`Swagger UI available at http://localhost:${env.PORT}/docs`);
  });
}

bootstrap().catch((err) => {
  console.error("Gagal memulai StepSafe backend:", err);
  process.exit(1);
});
