import { mysqlTable, serial, varchar, float } from "drizzle-orm/mysql-core";

export const schools = mysqlTable("schools", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  address: varchar("address", { length: 512 }).notNull(),
  latitude: float("latitude").notNull(),
  longitude: float("longitude").notNull(),
});
