import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { APP_GUARD, APP_FILTER, APP_PIPE } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";

import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { InfluencersModule } from "./influencers/influencers.module";
import { LeadsModule } from "./leads/leads.module";
import { LeadInteractionsModule } from "./lead-interactions/lead-interactions.module";
import { SalesModule } from "./sales/sales.module";
import { DashboardModule } from "./dashboard/dashboard.module";

import databaseConfig from "./config/database.config";
import jwtConfig from "./config/jwt.config";
import appConfig from "./config/app.config";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig, appConfig],
      envFilePath: ".env",
    }),
    // Add native Mongo provider module
    require("./common/providers/mongo.provider").MongoProviderModule,
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>("database.uri"),
        // Pass explicit dbName (useful when using SRV strings without a path)
        dbName: configService.get<string>("database.dbName"),
        // Fail fast on bad network/whitelist so logs are clear during dev
        serverSelectionTimeoutMS: 5000,
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    InfluencersModule,
    LeadsModule,
    LeadInteractionsModule,
    SalesModule,
    DashboardModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useFactory: () =>
        new ValidationPipe({
          whitelist: true,
          forbidNonWhitelisted: false, // Changed to false to allow extra properties (they'll be stripped anyway)
          transform: true,
          transformOptions: {
            enableImplicitConversion: true,
          },
        }),
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
