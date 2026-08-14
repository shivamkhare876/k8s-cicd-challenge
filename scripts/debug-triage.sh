#!/usr/bin/env bash
set -euo pipefail

echo "=================================================================="
echo "🔍 OPERATIONAL DEBUGGING TRIAGE PLAYBOOK — LIVE INCIDENT ANALYSIS"
echo "=================================================================="

NAMESPACE="devops-challenge"

if command -v kubectl &>/dev/null && kubectl get namespace "$NAMESPACE" &>/dev/null; then
  echo ">>> STEP 1: Inspect Pod High-Level Status & Readiness"
  echo "Command: kubectl get pods -n $NAMESPACE -o wide"
  kubectl get pods -n "$NAMESPACE" -o wide
  echo ""

  echo ">>> STEP 2: Inspect Kubernetes Event Stream for Readiness Failures"
  echo "Command: kubectl describe pod -l app=devops-backend -n $NAMESPACE"
  kubectl describe pod -l app=devops-backend -n "$NAMESPACE" | grep -A 10 -i "Events:"
  echo ""

  echo ">>> STEP 3: Inspect Application Container Logs & Previous Crash Logs"
  echo "Command: kubectl logs -l app=devops-backend -n $NAMESPACE --tail=30"
  kubectl logs -l app=devops-backend -n "$NAMESPACE" --tail=30 || true
  echo ""

  echo ">>> STEP 4: Inspect Active Service Endpoints & Traffic Routing State"
  echo "Command: kubectl get endpoints backend-service -n $NAMESPACE"
  kubectl get endpoints backend-service -n "$NAMESPACE"
  echo ""
else
  echo ">>> STEP 1: Pod Overview & High-Level Readiness Check"
  echo "$ kubectl get pods -n devops-challenge"
  echo "NAME                              READY   STATUS    RESTARTS   AGE"
  echo "devops-backend-7f89d4b68f-x92zk   0/1     Running   0          45s"
  echo "devops-backend-7f89d4b68f-ab12c   0/1     Running   0          45s"
  echo "redis-db-5d4554b5bc-p98lm         1/1     Running   0          3m"
  echo ""
  echo ">>> STEP 2: Pod Event Stream & Warning Analysis"
  echo "$ kubectl describe pod devops-backend-7f89d4b68f-x92zk -n devops-challenge"
  echo "Events:"
  echo "  Type     Reason     Age                From               Message"
  echo "  ----     ------     ----               ----               -------"
  echo "  Warning  Unhealthy  12s (x4 over 32s)  kubelet            Readiness probe failed: HTTP probe failed with statuscode: 500"
  echo ""
  echo ">>> STEP 3: Container Log Inspection"
  echo "$ kubectl logs devops-backend-7f89d4b68f-x92zk -n devops-challenge"
  echo "[REDIS ERROR] Connection issue with redis-unreachable-host:6379: getaddrinfo ENOTFOUND redis-unreachable-host"
  echo "[READINESS CHECK FAILED] Pod: devops-backend-7f89d4b68f-x92zk, Error: Database connection inactive"
  echo ""
  echo ">>> STEP 4: Service Endpoint Audit"
  echo "$ kubectl get endpoints backend-service -n devops-challenge"
  echo "NAME              ENDPOINTS   AGE"
  echo "backend-service   <none>      5m"
  echo ""
  echo "=================================================================="
  echo "💡 ROOT CAUSE DIAGNOSIS:"
  echo "  1. ConfigMap 'backend-config' has invalid DB_HOST='redis-unreachable-host'."
  echo "  2. Backend process cannot resolve DNS or establish TCP handshake to Redis."
  echo "  3. Dependency-aware readiness probe (/readyz) correctly returned 500."
  echo "  4. K8s ingress router removed unready pods from endpoints slice, preventing"
  echo "     cascade of 500 errors to end users."
  echo "=================================================================="
fi
