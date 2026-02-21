import { Module, Logger } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { Db, MongoClient } from "mongodb";
import { Constants } from "../constants";
import * as dns from "dns";
import { URL } from "node:url";

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: Constants.MONGO_PROVIDER,
      useFactory: async (configService: ConfigService): Promise<Db> => {
        const uri =
          configService.get<string>("database.uri") || process.env.MONGODB_URI;
        const dbName =
          configService.get<string>("database.dbName") ||
          process.env.MONGODB_DB ||
          "lead-management";
        const allowInvalidTLS =
          process.env.MONGODB_TLS_ALLOW_INVALID === "true" ||
          configService.get<string>("database.tlsAllowInvalid") === "true";

        const connectOpts: any = {
          serverSelectionTimeoutMS: 5000,
          tls: true,
        };

        if (allowInvalidTLS) {
          connectOpts.tlsAllowInvalidCertificates = true;
          connectOpts.tlsAllowInvalidHostnames = true;
          Logger.warn(
            "MONGODB_TLS_ALLOW_INVALID is enabled — TLS certificate validation is disabled",
          );
        }

        const logAndWrap = (msg: string, err: any) => {
          Logger.error(msg + (err && err.message ? `: ${err.message}` : ""));
          Logger.debug(err);
        };

        // First try: normal connect using the provided URI (works for mongodb and mongodb+srv)
        try {
          Logger.log("Attempting MongoDB connect using supplied URI");
          const client = await MongoClient.connect(uri, connectOpts);
          Logger.log("MongoDB connected using supplied URI");
          return client.db(dbName);
        } catch (firstErr) {
          logAndWrap("Error connecting DB (initial attempt)", firstErr);

          // Second try: if URI was SRV (mongodb+srv), try resolving SRV records and connecting directly to a host
          try {
            const parsed = new URL(uri);
            const isSrv = parsed.protocol === "mongodb+srv:";
            if (isSrv) {
              const host = parsed.hostname;
              Logger.log(
                `SRV connection failed; attempting direct connect to SRV hosts for ${host}`,
              );
              const srvName = `_mongodb._tcp.${host}`;
              // Resolve SRV using a robust method that works across Node versions
              let resolveSrvFn: ((name: string) => Promise<any[]>) | undefined;
              if (
                (dns as any) &&
                (dns as any).promises &&
                typeof (dns as any).promises.resolveSrv === "function"
              ) {
                resolveSrvFn = (name: string) =>
                  (dns as any).promises.resolveSrv(name);
              } else {
                try {
                  // Try require('dns').promises
                  // eslint-disable-next-line @typescript-eslint/no-var-requires
                  const dnsReq = require("dns");
                  if (
                    dnsReq &&
                    dnsReq.promises &&
                    typeof dnsReq.promises.resolveSrv === "function"
                  ) {
                    resolveSrvFn = (name: string) =>
                      dnsReq.promises.resolveSrv(name);
                  }
                } catch (e) {
                  try {
                    // Try require('dns/promises') on older Node setups
                    // eslint-disable-next-line @typescript-eslint/no-var-requires
                    const dnsPromises = require("dns/promises");
                    if (
                      dnsPromises &&
                      typeof dnsPromises.resolveSrv === "function"
                    ) {
                      resolveSrvFn = (name: string) =>
                        dnsPromises.resolveSrv(name);
                    }
                  } catch (ee) {
                    // leave undefined
                  }
                }
              }

              if (!resolveSrvFn) {
                throw new Error(
                  "DNS SRV resolution not available in this Node runtime",
                );
              }

              const records = await resolveSrvFn(srvName);
              // try hosts in order
              for (const rec of records) {
                const target = `${rec.name}:${rec.port}`;
                const username = parsed.username || "";
                const password = parsed.password || "";
                // build a direct mongodb URI to the host
                const cred = username
                  ? `${encodeURIComponent(username)}:${encodeURIComponent(password)}@`
                  : "";
                const hostUri = `mongodb://${cred}${rec.name}:${rec.port}/${dbName}?retryWrites=true&w=majority`;
                Logger.log(
                  `Attempting direct connect to ${rec.name}:${rec.port}`,
                );
                try {
                  const client = await MongoClient.connect(hostUri, {
                    directConnection: true,
                    tls: true,
                    serverSelectionTimeoutMS: 5000,
                  });
                  Logger.log(`MongoDB connected directly to ${rec.name}`);
                  return client.db(dbName);
                } catch (hostErr) {
                  logAndWrap(`Direct connect to ${rec.name} failed`, hostErr);
                  // continue to next record
                }
              }
            }
          } catch (srvErr) {
            logAndWrap("SRV/direct connect attempt failed", srvErr);
          }

          // Third try (debug fallback): attempt connect with invalid TLS allowed if configured
          if (allowInvalidTLS) {
            try {
              Logger.log(
                "Attempting MongoDB connect with TLS validation disabled (debug fallback)",
              );
              const client = await MongoClient.connect(uri, {
                ...connectOpts,
                tlsAllowInvalidCertificates: true,
                tlsAllowInvalidHostnames: true,
              });
              Logger.log("MongoDB connected with TLS validation disabled");
              return client.db(dbName);
            } catch (secondErr) {
              logAndWrap(
                "Error connecting DB with TLS invalid allowed (fallback)",
                secondErr,
              );
            }
          }

          // All attempts failed — rethrow the initial error for stack context
          throw firstErr;
        }
      },
      inject: [ConfigService],
    },
  ],
  exports: [Constants.MONGO_PROVIDER],
})
export class MongoProviderModule {}
