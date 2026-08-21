#!/usr/bin/env node
// Arranque para producción local: compila si hace falta, muestra la URL LAN
// y levanta el servidor accesible desde toda la red.
import { execSync, spawn } from "child_process";
import { networkInterfaces } from "os";
import { existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
process.chdir(root);

const PORT = process.env.PORT ?? "3000";

if (!existsSync(path.join(root, "node_modules"))) {
  console.log("Instalando dependencias (primera vez)…");
  execSync("npm install", { stdio: "inherit" });
}

if (!existsSync(path.join(root, ".next", "BUILD_ID"))) {
  console.log("Compilando la aplicación (primera vez, puede tardar unos minutos)…");
  execSync("npx next build", { stdio: "inherit" });
}

// Usuario admin inicial si la base está vacía (idempotente)
execSync("npx tsx scripts/seed.ts", { stdio: "inherit" });

const ips = Object.values(networkInterfaces())
  .flat()
  .filter((i) => i && i.family === "IPv4" && !i.internal)
  .map((i) => i.address);

console.log("\n========================================");
console.log("  Barra POS");
console.log(`  En esta computadora:  http://localhost:${PORT}`);
for (const ip of ips) {
  console.log(`  Desde la red local:   http://${ip}:${PORT}`);
}
console.log("========================================\n");

const child = spawn("npx", ["next", "start", "-H", "0.0.0.0", "-p", PORT], {
  stdio: "inherit",
});
child.on("exit", (code) => process.exit(code ?? 0));
