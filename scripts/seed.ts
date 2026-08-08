// Crea los usuarios iniciales si no existe ningún usuario.
// Uso: npx tsx scripts/seed.ts
import { db, users } from "../src/db";
import bcrypt from "bcryptjs";

const existing = db.select({ id: users.id }).from(users).limit(1).all();
if (existing.length > 0) {
  console.log("Ya existen usuarios, no se crean los usuarios iniciales.");
  process.exit(0);
}

db.insert(users)
  .values([
    {
      username: "superadmin",
      passwordHash: bcrypt.hashSync("superadmin", 10),
      fullName: "Super Admin",
      role: "superadmin",
    },
    {
      username: "admin",
      passwordHash: bcrypt.hashSync("admin", 10),
      fullName: "Administrador",
      role: "admin",
    },
  ])
  .run();

console.log("Usuarios iniciales creados:");
console.log("  superadmin / superadmin  (panel de control + todo)");
console.log("  admin / admin            (gestión)");
console.log("IMPORTANTE: cambiá las contraseñas desde Admin → Usuarios.");
