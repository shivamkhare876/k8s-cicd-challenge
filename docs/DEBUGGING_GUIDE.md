# 🔍 SRE Triage & Live Debugging Playbook

This document details the exact 4-step SRE incident triage methodology executed during Section 3 of the challenge video.

## Incident Summary
- **Symptom**: Application backend pods enter `0/1 READY` state; Endpoints slice drops pod IPs, HTTP traffic returns `503 Service Unavailable`.
- **Root Cause**: Invalid `DB_HOST` hostname in `ConfigMap/backend-config` causing Redis connection failure & readiness probe HTTP 500 failure.

## 4-Step SRE Debugging Methodology

### Step 1: Cluster Overview & Pod Status
Execute command:
```bash
kubectl get pods -n devops-challenge -o wide
```
**Observed Output**:
```
NAME                              READY   STATUS    RESTARTS   AGE     IP           NODE
devops-backend-7f89d4b68f-x92zk   0/1     Running   0          45s     10.244.0.5   kind-control-plane
devops-backend-7f89d4b68f-ab12c   0/1     Running   0          45s     10.244.0.6   kind-control-plane
redis-db-5d4554b5bc-p98lm         1/1     Running   0          3m      10.244.0.4   kind-control-plane
```
*Diagnosis*: Pod is running at the process level, but Kubernetes marked it UNREADY (`0/1`).

### Step 2: Kubernetes Event Stream Triage
Execute command:
```bash
kubectl describe pod devops-backend-7f89d4b68f-x92zk -n devops-challenge
```
**Observed Events**:
```
Events:
  Type     Reason     Age                From               Message
  ----     ------     ----               ----               -------
  Warning  Unhealthy  12s (x4 over 32s)  kubelet            Readiness probe failed: HTTP probe failed with statuscode: 500
```
*Diagnosis*: Kubelet readiness probe checking `/readyz` is failing with status code 500.

### Step 3: Application Container Log Inspection
Execute command:
```bash
kubectl logs devops-backend-7f89d4b68f-x92zk -n devops-challenge --tail=30
```
**Observed Log Output**:
```
[REDIS ERROR] Connection issue with redis-unreachable-host:6379: getaddrinfo ENOTFOUND redis-unreachable-host
[READINESS CHECK FAILED] Pod: devops-backend-7f89d4b68f-x92zk, Error: Database connection inactive
```
*Diagnosis*: Application cannot resolve DNS for `redis-unreachable-host`.

### Step 4: Endpoint Isolation Verification
Execute command:
```bash
kubectl get endpoints backend-service -n devops-challenge
```
**Observed Output**:
```
NAME              ENDPOINTS   AGE
backend-service   <none>      5m
```
*Diagnosis*: K8s readiness probe successfully isolated bad pods from service routing.

## Remediation
Restore valid ConfigMap:
```bash
kubectl apply -f k8s/01-configmap.yaml
kubectl rollout restart deployment/devops-backend -n devops-challenge
```
