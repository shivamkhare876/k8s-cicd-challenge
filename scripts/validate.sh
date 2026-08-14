#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

chmod +x "$PROJECT_ROOT/scripts"/*.sh

echo "=================================================================="
echo "✅ PROJECT VALIDATION REPORT"
echo "=================================================================="
echo "Project Path: $PROJECT_ROOT"
echo ""
echo "Checking required files:"
FILES=(
  "app/package.json"
  "app/server.js"
  "app/public/index.html"
  "app/public/style.css"
  "app/public/app.js"
  "app/Dockerfile"
  "app/test.js"
  "k8s/00-namespace.yaml"
  "k8s/01-configmap.yaml"
  "k8s/02-secret.yaml"
  "k8s/03-redis.yaml"
  "k8s/04-backend.yaml"
  "k8s/05-service.yaml"
  "k8s/06-hpa.yaml"
  "k8s/07-ingress.yaml"
  "helm/app-chart/Chart.yaml"
  "helm/app-chart/values.yaml"
  ".github/workflows/ci-cd.yml"
  "scripts/setup.sh"
  "scripts/simulate-failure.sh"
  "scripts/debug-triage.sh"
  "scripts/restore-health.sh"
  "docs/VIDEO_SCRIPT.md"
  "docs/ARCHITECTURE.md"
  "docs/DEBUGGING_GUIDE.md"
  "README.md"
)

MISSING=0
for f in "${FILES[@]}"; do
  if [ -f "$PROJECT_ROOT/$f" ]; then
    echo "  [OK] $f"
  else
    echo "  [MISSING] $f"
    MISSING=$((MISSING + 1))
  fi
done

echo "------------------------------------------------------------------"
if [ "$MISSING" -eq 0 ]; then
  echo "🎉 ALL 23 REQUIRED PROJECT ASSETS PRESENT AND VALIDATED!"
else
  echo "⚠️ $MISSING files missing!"
  exit 1
fi
echo "=================================================================="
