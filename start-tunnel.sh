#!/bin/bash
# ============================================
# Rezept Organizer - ngrok Tunnel Starter
# Feste URL: https://coleman-unprivate-santos.ngrok-free.dev
# ============================================

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

PORT=3000
NGROK="$HOME/.local/bin/ngrok"
DOMAIN="coleman-unprivate-santos.ngrok-free.dev"

# Start Next.js if not already running
if ! lsof -i :$PORT &>/dev/null; then
  echo "🚀 Starte Next.js auf Port $PORT..."
  npx next dev -H 0.0.0.0 -p $PORT &
  NEXT_PID=$!
  sleep 5
else
  echo "✅ Next.js läuft bereits auf Port $PORT"
  NEXT_PID=""
fi

echo ""
echo "🌍 Starte ngrok Tunnel..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📱 Deine feste URL:"
echo "   https://$DOMAIN"
echo ""
echo "   Öffne die URL auf deinem iPhone!"
echo "   Tipp: Safari → Teilen → 'Zum Home-Bildschirm'"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Drücke Ctrl+C zum Beenden."

cleanup() {
  echo ""
  echo "🛑 Beende Tunnel und Server..."
  kill $TUNNEL_PID 2>/dev/null
  [ -n "$NEXT_PID" ] && kill $NEXT_PID 2>/dev/null
  exit 0
}
trap cleanup SIGINT SIGTERM

$NGROK http $PORT --domain=$DOMAIN &
TUNNEL_PID=$!

wait
