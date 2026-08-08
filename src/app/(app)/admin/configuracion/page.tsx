import { requireAdmin } from "@/lib/auth";
import { getAllSettings } from "@/lib/settings";
import { PageTitle } from "@/components/ui";
import { SettingsForm, BackupPanel } from "./forms";
import path from "path";
import fs from "fs";

export default async function ConfiguracionPage() {
  await requireAdmin();
  const settings = getAllSettings();

  const backupsDir = path.join(process.cwd(), "data", "backups");
  let backups: { name: string; size: number }[] = [];
  try {
    backups = fs
      .readdirSync(backupsDir)
      .filter((f) => f.endsWith(".db"))
      .sort()
      .reverse()
      .slice(0, 10)
      .map((name) => ({
        name,
        size: fs.statSync(path.join(backupsDir, name)).size,
      }));
  } catch {
    // sin backups todavía
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <PageTitle>Configuración</PageTitle>
      <SettingsForm
        businessName={settings.business_name ?? ""}
        ticketWidth={settings.ticket_width ?? "80"}
        ticketFooter={settings.ticket_footer ?? ""}
      />
      <BackupPanel backups={backups} />
    </div>
  );
}
