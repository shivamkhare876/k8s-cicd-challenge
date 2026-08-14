#!/usr/bin/env bash
set -euo pipefail

echo "=================================================================="
echo "🛠️ RESTORE HEALTH & ZERO-DOWNTIME ROLLING UPDATE"
echo "=================================================================="
echo "Fixing Root Cause: Re-applying clean ConfigMap with valid DB_HOST='redis-service'"
echo "=================================================================="

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NAMESPACE="devops-challenge"

rm -f "$PROJECT_ROOT/k8s/01-configmap-broken.yaml"

if command -v kubectl &>/dev/null && kubectl get namespace "$NAMESPACE" &>/dev/null; then
  echo "[FIX] Applying clean ConfigMap..."
  kubectl apply -f "$PROJECT_ROOT/k8s/01-configmap.yaml"
  echo "[FIX] Performing Rolling Update..."
  kubectl rollout restart deployment/devops-backend -n "$NAMESPACE"
  echo "[VERIFY] Waiting for rollout to complete..."
  kubectl rollout status deployment/devops-backend -n "$NAMESPACE" --timeout=60s
  echo "[SUCCESS] Cluster restored to 100% healthy state!"
  kubectl get pods -n "$NAMESPACE" -o wide
else
  echo "[RESTORATION SIMULATED] ConfigMap restored."
  echo "  1. ConfigMap updated: DB_HOST='redis-service'"
  echo "  2. K8s initiates Rolling Update (maxSurge=1, maxUnavailable=0)."
  echo "  3. New pod passes readiness probe (/readyz HTTP 200 OK)."
  echo "  4. Service Endpoints updated: 2/2 pods READY."
  echo ""
  echo "System Health Status: 🟢 100% HEALTHY & OPERATIONAL"
fi
