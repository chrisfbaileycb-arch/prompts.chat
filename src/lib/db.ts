import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: any;
};

const createPrismaClient = () => {
  let realClient: PrismaClient | null = null;
  if (process.env.DATABASE_URL) {
    try {
      realClient = new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
        datasourceUrl: process.env.DATABASE_URL,
      });
    } catch {
      console.warn("[AI Studio] PrismaClient initialization failed - falling back to mock");
    }
  } else {
    console.warn("[AI Studio] DATABASE_URL not set — database mock active");
  }

  const noOpModel = {
    findMany: async () => [],
    findFirst: async () => null,
    findUnique: async () => null,
    count: async () => 0,
    groupBy: async () => [],
    aggregate: async () => ({ _count: 0, _sum: {}, _avg: {}, _min: {}, _max: {} }),
    create: async (args: any) => args?.data ?? {},
    update: async (args: any) => args?.data ?? {},
    upsert: async (args: any) => args?.create ?? {},
    delete: async () => ({}),
    deleteMany: async () => ({ count: 0 }),
    updateMany: async () => ({ count: 0 }),
  };

  const clientProxy: any = new Proxy(
    {},
    {
      get(_, prop: string) {
        if (prop === "$connect") return async () => {};
        if (prop === "$disconnect") return async () => {};
        if (prop === "$transaction") {
          return async (arg: any) => {
            if (Array.isArray(arg)) {
              return Promise.all(arg);
            }
            if (typeof arg === "function") {
              return arg(clientProxy);
            }
            return [];
          };
        }
        if (prop === "$queryRaw" || prop === "$queryRawUnsafe") return async () => [];
        if (prop === "$executeRaw" || prop === "$executeRawUnsafe") return async () => 0;

        if (realClient && (realClient as any)[prop]) {
          const target = (realClient as any)[prop];
          if (typeof target === "object" && target !== null) {
            return new Proxy(target, {
              get(modelTarget, modelProp: string) {
                const origMethod = (modelTarget as any)[modelProp];
                if (typeof origMethod === "function") {
                  return async (...args: any[]) => {
                    try {
                      return await origMethod.apply(modelTarget, args);
                    } catch (err: any) {
                      console.warn(
                        `[AI Studio] DB query failed on ${String(prop)}.${String(modelProp)}:`,
                        err?.message || err
                      );
                      const fallback = (noOpModel as any)[modelProp];
                      return fallback ? fallback(...args) : null;
                    }
                  };
                }
                return origMethod;
              },
            });
          }
          return target;
        }

        return noOpModel;
      },
    }
  );

  return clientProxy;
};

export const db: PrismaClient = (globalForPrisma.prisma ?? createPrismaClient()) as PrismaClient;

globalForPrisma.prisma = db;
export default db;
