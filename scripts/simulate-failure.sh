#!/usr/bin/env bash
set -euo pipefail

echo "=================================================================="
echo "💥 INTENTIONAL FAILURE SIMULATOR — READINESS PROBE / DB DISCONNECT"
echo "=================================================================="
echo "Injecting fault: Modifying ConfigMap DB_HOST to invalid host 'redis-unreachable-host'"
echo "Expected Symptom: Pod readiness probe (/readyz) fails with HTTP 500."
echo "                  Pods enter unready state (0/1 READY) & zero traffic routed."
echo "=================================================================="

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NAMESPACE="devops-challenge"

# Create broken configmap file for demo
cat <<EOF > "$PROJECT_ROOT/k8s/01-configmap-broken.yaml"
apiVersion: v1
kind: ConfigMap
metadata:
  name: backend-config
  namespace: devops-challenge
  labels:
    app: devops-backend
data:
  NODE_ENV: "production"
  PORT: "8080"
  DB_HOST: "redis-unreachable-host"
  DB_PORT: "6379"
  LOG_LEVEL: "debug"
EOF

if command -v kubectl &>/dev/null && kubectl get namespace "$NAMESPACE" &>/dev/null; then
  echo "[FAILURE INJECTED] Applying broken ConfigMap to live K8s cluster..."
  kubectl apply -f "$PROJECT_ROOT/k8s/01-configmap-broken.yaml"
  kubectl rollout restart deployment/devops-backend -n "$NAMESPACE"
  echo "[STATUS] Rollout triggered. Run 'bash scripts/debug-triage.sh' to debug live."
else
  echo "[FAILURE SIMULATED] Local environment mock simulation active."
  echo "  1. ConfigMap updated: DB_HOST='redis-unreachable-host'"
  echo "  2. Backend Readiness Probe (/readyz) returns: HTTP 500 Internal Server Error"
  echo "  3. Kubernetes Service removes unready pod IPs from Endpoints slice."
  echo ""
  echo "Execute triage: bash scripts/debug-triage.sh"
fi
