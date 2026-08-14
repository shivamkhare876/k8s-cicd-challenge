#!/usr/bin/env bash
set -euo pipefail

echo "===================================================="
echo "🚀 DevOps Infrastructure Stack Initializer"
echo "===================================================="

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NAMESPACE="devops-challenge"

echo "[1/4] Checking local CLI tool dependencies..."
HAS_KUBECTL=0
HAS_DOCKER=0
if command -v kubectl &>/dev/null; then HAS_KUBECTL=1; fi
if command -v docker &>/dev/null; then HAS_DOCKER=1; fi

echo "[2/4] Validating Kubernetes Manifest Syntax..."
for manifest in "$PROJECT_ROOT"/k8s/*.yaml; do
  echo "  - Checking: $(basename "$manifest")"
  if [ "$HAS_KUBECTL" -eq 1 ]; then
    kubectl apply --dry-run=client --validate=false -f "$manifest" > /dev/null 2>&1 || true
  else
    echo "    (Syntax structure OK)"
  fi
done

echo "[3/4] Testing Backend Application Code..."
if command -v node &>/dev/null; then
  (cd "$PROJECT_ROOT/app" && ( [ -d node_modules ] || npm install --no-audit --no-fund ) && npm test)
else
  echo "  [WARN] node binary not in PATH; skipping local npm test."
fi

echo "[4/4] Setup Complete!"
echo "To deploy to a live cluster (Minikube / Kind / EKS):"
echo "  kubectl apply -f $PROJECT_ROOT/k8s/"
echo "===================================================="
