# 🏛️ DevOps Infrastructure Architecture Specification

## Architecture Overview

```
                      +------------------------------------------+
                      |         Kubernetes Cluster               |
                      |      Namespace: devops-challenge          |
                      |                                          |
                      |  +------------------------------------+  |
  HTTP Traffic        |  |          NGINX Ingress             |  |
====================> |  +-----------------+------------------+  |
                      |                    |                     |
                      |                    v                     |
                      |  +------------------------------------+  |
                      |  |     Service: backend-service       |  |
                      |  |     (ClusterIP / NodePort 30080)   |  |
                      |  +-----------------+------------------+  |
                      |                    |                     |
                      |          +---------+---------+           |
                      |          |                   |           |
                      |          v                   v           |
                      |  +---------------+   +---------------+   |
                      |  | Backend Pod 1 |   | Backend Pod 2 |   |
                      |  |  (Node.js)    |   |  (Node.js)    |   |
                      |  |               |   |               |   |
                      |  | Probes:       |   | Probes:       |   |
                      |  | - /healthz    |   | - /healthz    |   |
                      |  | - /readyz     |   | - /readyz     |   |
                      |  +-------+-------+   +-------+-------+   |
                      |          |                   |           |
                      |          +---------+---------+           |
                      |                    |                     |
                      |                    v                     |
                      |  +------------------------------------+  |
                      |  |      Service: redis-service        |  |
                      |  |          (Port 6379)               |  |
                      |  +-----------------+------------------+  |
                      |                    |                     |
                      |                    v                     |
                      |  +------------------------------------+  |
                      |  |        Deployment: redis-db        |  |
                      |  |           (Redis 7 Alpine)         |  |
                      |  +------------------------------------+  |
                      +------------------------------------------+
```

## Key Architectural Decisions

1. **Decoupled 2-Tier Stack**:
   - Backend API built with Express, containerized via multi-stage Dockerfile running non-root alpine image.
   - Redis state store running as dedicated K8s deployment & service.

2. **Reliability & Availability Controls**:
   - **Liveness Probe**: Hits `/healthz` to detect process hang/deadlock.
   - **Readiness Probe**: Hits `/readyz` performing active TCP ping to Redis DB. Unready pods are immediately removed from endpoint slices.
   - **HorizontalPodAutoscaler (HPA)**: Scales pods dynamically between 2 and 10 based on CPU (70%) and Memory (80%) utilization.
   - **Rolling Update Strategy**: Configured with `maxSurge: 1` and `maxUnavailable: 0` to guarantee zero-downtime deployments.

3. **Security Posture**:
   - Hardened non-root execution (`USER node`, `UID 1000`).
   - Resource quotas & requests/limits enforced (`cpu: 100m/300m`, `memory: 128Mi/256Mi`).
   - Configuration separation: Non-sensitive config in `ConfigMap`, sensitive passwords in `Secret`.
