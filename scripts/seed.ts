// Crea el usuario admin inicial si no existe ningún usuario.
// Uso: npx tsx scripts/seed.ts
import { db, users } from "../src/db";
import bcrypt from "bcryptjs";

const existing = db.select({ id: users.id }).from(users).limit(1).all();
if (existing.length > 0) {
  console.log("Ya existen usuarios, no se crea el admin inicial.");
  process.exit(0);
}

const passwordHash = bcrypt.hashSync("admin", 10);
db.insert(users)
  .values({
    username: "admin",
    passwordHash,
    fullName: "Administrador",
    role: "admin",
  })
  .run();

console.log("Usuario inicial creado → usuario: admin / contraseña: admin");
console.log("IMPORTANTE: cambiá la contraseña desde Admin → Usuarios.");
