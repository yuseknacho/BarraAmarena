// Crea el usuario inicial si no existe ningún usuario.
// Uso: npx tsx scripts/seed.ts
import { db, users } from "../src/db";
import bcrypt from "bcryptjs";

const existing = db.select({ id: users.id }).from(users).limit(1).all();
if (existing.length > 0) {
  console.log("Ya existen usuarios, no se crea el usuario inicial.");
  process.exit(0);
}

db.insert(users)
  .values({
    username: "superadmin",
    email: "yuseknacho@gmail.com",
    passwordHash: bcrypt.hashSync("superadmin", 10),
    fullName: "Super Admin",
    role: "superadmin",
  })
  .run();

console.log("Usuario inicial creado → superadmin / superadmin");
console.log("Desde Administración → Usuarios creá las cuentas de cada caja");
console.log("(rol Caja) y cambiá la contraseña del superadmin.");
