import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ConfigService } from "@nestjs/config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // CORS: optional comma-separated *exact* browser origins (scheme+host+port). E.g. both
  // `https://lms.ziloty.in` and `http://18.60.216.135:3001` if you use more than one URL.
  // If **unset/empty**: allow any origin. If set: request Origin must be in the list.
  // JWT uses `Authorization` on requests - explicit headers/methods help preflight succeed.
  const corsOriginsRaw = configService.get<string>("CORS_ORIGINS");
  const allowList = corsOriginsRaw
    ?.split(",")
    .map((o) => o.trim())
    .filter(Boolean) ?? [];
  const allowAnyOrigin = allowList.length === 0;
  app.enableCors({
    origin: (reqOrigin, cb) => {
      if (allowAnyOrigin) {
        return cb(null, true);
      }
      if (reqOrigin && allowList.includes(reqOrigin)) {
        return cb(null, true);
      }
      return cb(null, false);
    },
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Accept",
      "Authorization",
      "X-Requested-With",
    ],
    maxAge: 86400,
  });

  // Note: ValidationPipe is configured in app.module.ts as APP_PIPE
  // No need to configure it here to avoid conflicts

  // All HTTP routes under /api/* so nginx can proxy https://lms.ziloty.in/api/ -> this app
  // (avoids mixed-content: HTTPS page -> HTTP API). See lms-fe .env.example for nginx snippet.
  app.setGlobalPrefix("api");

  // Setup Swagger using @nestjs/swagger (served at /api/docs)
  const config = new DocumentBuilder()
    .setTitle("Lead Management API")
    .setDescription("API documentation")
    .setVersion("1.0.0")
    .addBearerAuth(
      { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      "bearer",
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  const port = configService.get<number>("app.port") || 3000;

  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}

bootstrap();
