#!/bin/bash
# Doble clic: deja Barra Amarena corriendo en segundo plano y la arranca
# sola cada vez que se inicia sesión en esta Mac.
set -e
cd "$(dirname "${BASH_SOURCE[0]}")/.."
ROOT="$(pwd)"
NODE="$(command -v node || echo /opt/homebrew/bin/node)"
PLIST="$HOME/Library/LaunchAgents/com.amarena.barra.plist"
mkdir -p "$HOME/Library/LaunchAgents" "$ROOT/data"

cat > "$PLIST" <<PL
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>com.amarena.barra</string>
  <key>ProgramArguments</key>
  <array><string>$NODE</string><string>$ROOT/scripts/start.mjs</string></array>
  <key>WorkingDirectory</key><string>$ROOT</string>
  <key>EnvironmentVariables</key>
  <dict><key>PATH</key><string>$(dirname "$NODE"):/usr/local/bin:/usr/bin:/bin</string></dict>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>$ROOT/data/servidor.log</string>
  <key>StandardErrorPath</key><string>$ROOT/data/servidor.log</string>
</dict>
</plist>
PL

launchctl bootout "gui/$(id -u)/com.amarena.barra" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST"
echo
echo "✅ Barra Amarena quedó instalada como servicio."
echo "   Arranca sola al iniciar sesión y se reinicia si se cae."
echo "   Local:      http://localhost:3000"
echo "   Tailscale:  http://$(scutil --get LocalHostName | tr 'A-Z' 'a-z'):3000"
echo "   Registro:   data/servidor.log"
echo
echo "Para desinstalar: doble clic en scripts/desinstalar-arranque-automatico.command"
read -n 1 -s -r -p "Presioná cualquier tecla para cerrar…"
