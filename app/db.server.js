import pkg from "@prisma/client";

// This is the corrected import syntax
const { PrismaClient } = pkg;

let prisma;

// this is needed because in development we don't want to restart
// the server with every change, but we want to make sure we don't
// create a new connection to the DB with every change either.
if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  if (!global.__db) {
    global.__db = new PrismaClient();
  }
  prisma = global.__db;
}

// This is the corrected line to match how your app imports this file
export default prisma;
