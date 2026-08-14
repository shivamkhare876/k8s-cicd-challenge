# 🚀 DevOps Engineer 90-Minute Infrastructure Challenge

[![Production CI/CD Pipeline](https://github.com/example/k8s-cicd-challenge/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/example/k8s-cicd-challenge/actions)
[![Kubernetes](https://img.shields.io/badge/kubernetes-1.28+-blue.svg)](https://kubernetes.io/)
[![Helm](https://img.shields.io/badge/helm-v3-35495e.svg)](https://helm.sh/)

A minimal production-style application stack built and deployed using Kubernetes, Docker, Helm, GitHub Actions CI/CD, and SRE reliability controls.

---

## 📁 Repository Structure

```
k8s-cicd-challenge/
├── app/                        # Node.js Express REST API + Redis Integration
│   ├── server.js               # Application logic & /healthz /readyz probes
│   ├── package.json            # Node.js dependencies
│   ├── Dockerfile              # Multi-stage security-hardened Dockerfile (non-root)
│   └── test.js                 # Unit & endpoint test runner
├── k8s/                        # Pure K8s Declarative Manifests
│   ├── 00-namespace.yaml       # Namespace definition (devops-challenge)
│   ├── 01-configmap.yaml       # Non-sensitive configuration (DB_HOST, DB_PORT)
│   ├── 02-secret.yaml          # Base64 encoded sensitive secrets
│   ├── 03-redis.yaml           # Redis Database Deployment & Service
│   ├── 04-backend.yaml         # Backend Deployment (probes, limits, securityContext)
│   ├── 05-service.yaml         # NodePort/ClusterIP Service
│   ├── 06-hpa.yaml             # HorizontalPodAutoscaler (CPU/Mem metrics)
│   └── 07-ingress.yaml         # NGINX Ingress Controller rule
├── helm/                       # Helm Templating Solution
│   └── app-chart/              # Parameterized Helm Chart with templates & values
├── .github/workflows/          # Production CI/CD Pipeline
│   └── ci-cd.yml               # Automated Build -> Test -> Security Scan -> Deploy -> Rollout
├── scripts/                    # Automation & Triage Tooling
│   ├── setup.sh                # Stack bootstrap script
│   ├── simulate-failure.sh     # Intentional DB failure simulator
│   ├── debug-triage.sh         # 4-Step SRE live debugging playbook
│   ├── restore-health.sh       # Zero-downtime rolling update recovery
│   └── validate.sh             # Repository integrity & syntax validator
└── docs/                       # Submission Artifacts & Video Documentation
    ├── VIDEO_SCRIPT.md         # 8-12 minute submission video script with dialogue & visual cues
    ├── ARCHITECTURE.md         # Architecture diagrams & decision rationale
    └── DEBUGGING_GUIDE.md      # Detailed SRE failure triage guide
```

---

## ⚡ Quick Start & Reproduction Guide

### 1. Prerequisites
- Docker Engine & `kubectl` CLI
- Local Kubernetes Cluster: Minikube / Kind / K3s / Docker Desktop K8s

### 2. Local Stack Bootstrap
Run the setup script to validate syntax and application unit tests:
```bash
bash scripts/setup.sh
```

### 3. Deploy Stack to Kubernetes
Deploy all declarative manifests using `kubectl`:
```bash
kubectl apply -f k8s/
```

Verify deployment rollout status:
```bash
kubectl rollout status deployment/devops-backend -n devops-challenge
```

Access the API:
```bash
curl http://localhost:30080/api/v1/status
```

---

## 🛡️ Reliability Improvement: Readiness & Liveness Probes

We implemented **Dependency-Aware Readiness and Liveness Probes**:
- **Liveness Probe (`/healthz`)**: Verifies Node.js event loop health.
- **Readiness Probe (`/readyz`)**: Performs active ping test against Redis DB.
- **Problem Solved**: Prevents K8s service router from forwarding traffic to unready pods during DB reconnection or warm-up.
- **Trade-off**: Increases initial pod startup latency and requires careful tuning of probe delay/threshold parameters.

---

## 💥 Intentional Failure Simulation & Debugging

Execute the failure simulator to break database host resolution:
```bash
bash scripts/simulate-failure.sh
```

Run the 4-step live debugging playbook:
```bash
bash scripts/debug-triage.sh
```

Restore cluster to 100% healthy state with zero downtime:
```bash
bash scripts/restore-health.sh
```

---

## 📹 Video Submission Guide
Refer to [docs/VIDEO_SCRIPT.md](file:///Users/shivamkhare/.gemini/antigravity/scratch/k8s-cicd-challenge/docs/VIDEO_SCRIPT.md) for the complete 8–12 minute presentation script.
