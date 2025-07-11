import pkg from "@prisma/client";

// This is the corrected import syntax for ES modules
const { PrismaClient } = pkg;

let prisma;

// This logic prevents creating multiple instances of Prisma Client in development
// due to hot reloading. In production, a single instance is created.
if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  if (!global.__db) {
    global.__db = new PrismaClient();
  }
  prisma = global.__db;
}

// By using `export default`, we are providing a default export
// which resolves the "default is not exported" build error.
export default prisma;
