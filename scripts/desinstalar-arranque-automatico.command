#!/bin/bash
# Doble clic: detiene el servicio y quita el arranque automático.
launchctl bootout "gui/$(id -u)/com.amarena.barra" 2>/dev/null || true
rm -f "$HOME/Library/LaunchAgents/com.amarena.barra.plist"
echo "✅ Arranque automático quitado. Podés volver a iniciar con scripts/iniciar.command"
read -n 1 -s -r -p "Presioná cualquier tecla para cerrar…"
