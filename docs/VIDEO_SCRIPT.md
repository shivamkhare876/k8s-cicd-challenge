# 🎥 DevOps Engineer 90-Minute Infrastructure Challenge — Video Submission Script

**Target Video Length**: 9:30–11:00 Minutes (Within mandatory 8–12 min requirement)  
**Speaker Role**: Senior DevOps / Platform Engineer  
**Screen Setup**: Split screen (Left: VS Code & Terminal, Right: Web Browser showing App API / GitHub Actions / Kubernetes Dashboard)

---

## ⏱️ Video Breakdown & Timeline Overview

| Section | Topic | Allocated Time | Start Time | End Time |
| :--- | :--- | :---: | :---: | :---: |
| **Section 1** | 🚀 Live Demo & Working Deployment | 3:30 Min | 00:00 | 03:30 |
| **Section 2** | 🏛️ Architecture & Reliability Decisions | 2:30 Min | 03:30 | 06:00 |
| **Section 3** | 💥 Failure Debugging Walkthrough | 3:00 Min | 06:00 | 09:00 |
| **Section 4** | ⚖️ Production Tradeoffs & Future Scale | 1:30 Min | 09:00 | 10:30 |

---

## SECTION 1: Live Demo & Working Deployment (00:00 – 03:30)

### 🎬 Visual Cues & Screen State
- **Screen**: VS Code on left displaying `k8s/` folder; Terminal on bottom running `kubectl get all -n devops-challenge`; Browser on right navigated to `http://localhost:30080/api/v1/status` and GitHub Actions tab.
- **Presenter**: Facecam in top-right corner.

### 🎙️ Spoken Dialogue Script

> **[00:00 - 00:30] Introduction & High-Level Scope**  
> *"Hi everyone! In this video, I'm demonstrating a complete production-style Kubernetes infrastructure stack built from scratch under 90 minutes. Our application stack consists of a containerized Node.js backend microservice connected to a Redis data store dependency running inside Kubernetes. We have automated CI/CD via GitHub Actions, strict readiness and liveness probe reliability controls, and a complete live incident debugging playbook."*

> **[00:30 - 01:30] Live Application & Database Demo**  
> *"Let's start by verifying the live running application stack. As you can see on the right side of my screen, our backend service is accessible via NodePort on port 30080.  
> When I hit `/api/v1/status`, it returns a 200 OK payload displaying our service metadata, pod hostname (`devops-backend-7f89d4b68f-x92zk`), uptime, and an active `dbConnected: true` flag.  
> Let's test writing a stateful key-value record to our Redis dependency using curl:  
> `curl -X POST http://localhost:30080/api/v1/data -H 'Content-Type: application/json' -d '{"key":"session_101", "value":{"user":"alex","role":"admin"}}'`  
> We get back a `201 Created` confirmation. Now, fetching `/api/v1/data/session_101` reads directly from Redis. This confirms our two-tier backend + database architecture is fully operational inside Kubernetes."*

> **[01:30 - 02:30] Kubernetes Resources & Cluster Health**  
> *"Now let's examine our Kubernetes cluster state in the terminal. I'll run `kubectl get all,hpa,ingress -n devops-challenge -o wide`.  
> Here are our core resources:
> 1. **Namespace**: `devops-challenge` providing strict logical isolation.
> 2. **Redis Database**: Single pod deployment with a dedicated ClusterIP service (`redis-service`) listening on internal port 6379 with resource limits and TCP liveness checks.
> 3. **Backend API Deployment**: Running 2 replicas with rolling update strategy (`maxSurge: 1`, `maxUnavailable: 0`). Notice both pods show `1/1 READY`.
> 4. **Service & Ingress**: Exposed via `backend-service` and NGINX Ingress controller for layer-7 routing.
> 5. **Autoscaler (HPA)**: Configured to automatically scale pods between 2 and 10 based on 70% CPU and 80% memory utilization."*

> **[02:30 - 03:30] Automated CI/CD Pipeline Execution**  
> *"Next, let's look at our automated CI/CD pipeline in GitHub Actions.  
> Over on the browser tab, you can see our workflow `.github/workflows/ci-cd.yml`. It runs automatically on every push to main and executes three mandatory stages:
> - **Stage 1: Code Quality & Unit Tests** — Installs dependencies, runs `npm test`, and dry-run validates all K8s manifests using `kubectl apply --dry-run=client`.
> - **Stage 2: Container Security & Build** — Executes a multi-stage Docker build producing a non-root alpine image, followed by a Trivy security vulnerability scan checking for CRITICAL/HIGH CVEs.
> - **Stage 3: Automated K8s Deployment & Rollout Verification** — Applies our manifests, executes `kubectl rollout status`, and automatically invokes `kubectl rollout undo` if the deployment stalls or fails health checks.
> This provides a complete, automated git-driven deployment loop."*

---

## SECTION 2: Architecture & Reliability Decisions (03:30 – 06:00)

### 🎬 Visual Cues & Screen State
- **Screen**: Display `docs/ARCHITECTURE.md` containing the ASCII architecture diagram, K8s manifests (`04-backend.yaml`), and Helm values (`helm/app-chart/values.yaml`).

### 🎙️ Spoken Dialogue Script

> **[03:30 - 04:30] Stack Architecture & Structuring Rationale**  
> *"Now let's walk through our architecture choices and why we structured the repository this way.  
> We deliberately chose a decoupled microservices model: an Express backend service communicating asynchronously with Redis over Kubernetes internal DNS (`redis-service.devops-challenge.svc.cluster.local`).  
> All non-sensitive parameters (`NODE_ENV`, `PORT`, `DB_HOST`) are injected via a `ConfigMap`, while database authentication keys are stored in base64-encoded `Secrets`.  
> Furthermore, we authored both **pure declarative K8s manifests** for simple deployments AND a **Helm Chart** (`helm/app-chart`) with parameterized `values.yaml`. Helm templating allows us to deploy identical infrastructure across `dev`, `staging`, and `production` environments by overriding environment variables without duplicating YAML files."*

> **[04:30 - 06:00] Mandatory Reliability Control: Dependency-Aware Readiness & Liveness Probes**  
> *"For our mandatory reliability improvement, I selected **Dependency-Aware Readiness and Liveness Probes coupled with Resource Requests & Limits**.  
> **Why did I choose this specific reliability mechanism?**  
> In standard container runtimes, process existence (`ps node`) only tells you the OS process is alive—it does NOT guarantee the application can serve user traffic or reach its database dependency.  
> Here is how we implemented it in `04-backend.yaml`:  
> - **Liveness Probe**: Hits `/healthz` every 10 seconds. If the HTTP event loop freezes or deadlocks, Kubernetes kills and restarts the container.  
> - **Readiness Probe**: Hits `/readyz` every 5 seconds. Crucially, `/readyz` performs an active TCP ping check to Redis. If Redis is down, unreachable, or overloaded, `/readyz` returns HTTP 500.  
> 
> **What problem does this solve?**  
> It solves the **'black hole endpoint' problem**. Without a readiness probe, Kubernetes sends user traffic to newly started or broken pods before they connect to the database, causing users to see 500 errors. With our readiness probe, K8s automatically removes unready pods from the service Endpoints slice.  
> 
> **What tradeoff does it introduce?**  
> The trade-off is **startup delay and sensitivity to transient DB blips**. If your database experiences a 10-second failover or latency spike, a strict readiness probe can mark ALL backend pods unready simultaneously, temporarily dropping all traffic. Additionally, setting liveness thresholds too aggressively can cause cascading restart loops during high CPU spikes."*

---

## SECTION 3: Failure Debugging Walkthrough (06:00 – 09:00)

### 🎬 Visual Cues & Screen State
- **Screen**: Terminal full screen. Command history showing `bash scripts/simulate-failure.sh`, followed by live step-by-step triage commands (`kubectl get pods`, `kubectl describe pod`, `kubectl logs`, `kubectl get endpoints`).

### 🎙️ Spoken Dialogue Script

> **[06:00 - 06:45] Intentional Failure Trigger**  
> *"Now for the most important section: **Intentional Failure Simulation & Live Debugging**.  
> I am going to intentionally break our system live by injecting a database host resolution failure into our cluster.  
> I'll execute our script: `bash scripts/simulate-failure.sh`.  
> This script updates our `ConfigMap` parameter `DB_HOST` to point to a non-existent host: `redis-unreachable-host`, and triggers a deployment rollout.  
> Now let's watch the symptoms unfold live."*

> **[06:45 - 07:30] Symptom Observation & Triage Step 1 & 2**  
> *"Let's follow our 4-step SRE debugging playbook.  
> **Step 1: High-Level Pod Status Check**  
> I run: `kubectl get pods -n devops-challenge -o wide`.  
> Look at the output: `devops-backend-7f89d4b68f-x92zk` shows status `0/1 READY`! The pod is running at the OS level, but Kubernetes refuses to route traffic to it.  
> 
> **Step 2: Inspect Kubernetes Event Stream**  
> Let's investigate why K8s marked it unready. I run: `kubectl describe pod devops-backend-7f89d4b68f-x92zk -n devops-challenge`.  
> Scrolling down to the `Events` table, we see a crucial warning:  
> `Warning Unhealthy 12s (x4 over 32s) kubelet Readiness probe failed: HTTP probe failed with statuscode: 500`.  
> The kubelet readiness probe is actively failing."*

> **[07:30 - 08:15] Triage Step 3 & 4 (Root Cause Pinpoint)**  
> *"**Step 3: Container Log Deep-Dive**  
> Now let's see why `/readyz` returned 500. I run: `kubectl logs devops-backend-7f89d4b68f-x92zk -n devops-challenge --tail=20`.  
> Look at line 4 of the log output:  
> `[REDIS ERROR] Connection issue with redis-unreachable-host:6379: getaddrinfo ENOTFOUND redis-unreachable-host`  
> `[READINESS CHECK FAILED] Pod: devops-backend-7f89d4b68f-x92zk, Error: Database connection inactive`.  
> 
> **Step 4: Endpoint Routing State Check**  
> Let's check `kubectl get endpoints backend-service -n devops-challenge`. The endpoints list shows `<none>`! Because the readiness probe failed, Kubernetes isolated the broken pod and removed its IP address from the routing table.  
> 
> **Root Cause Diagnosis Summary**:  
> The root cause was a misconfigured `DB_HOST` in ConfigMap `backend-config`. Because we built a dependency-aware readiness probe, the system detected the broken dependency, prevented user traffic from hitting broken containers, and gave us exact error logs pinpointing the DNS resolution failure."*

> **[08:15 - 09:00] Live Remediation & Zero-Downtime Rollout**  
> *"Now let's fix it live. I run `bash scripts/restore-health.sh`.  
> This restores our clean ConfigMap with `DB_HOST: redis-service` and executes `kubectl rollout restart deployment/devops-backend`.  
> Watching `kubectl rollout status`: the new container spins up, connects to Redis, passes `/readyz` HTTP 200, becomes `1/1 READY`, and K8s smoothly terminates the old unready pod.  
> Running `kubectl get pods` confirms status is back to 🟢 `1/1 READY` across all replicas with zero downtime!"*

---

## SECTION 4: Tradeoff Discussion & Production Future (09:00 – 10:30)

### 🎬 Visual Cues & Screen State
- **Screen**: Full screen facecam with overlay bullet points showing:
  - 1. Simple Single-Node Redis (No HA Sentinel/Cluster)
  - 2. In-Cluster Secrets vs Vault/SealedSecrets
  - 3. Production Improvements at Scale

### 🎙️ Spoken Dialogue Script

> **[09:00 - 09:45] Intentional Simplifications & What Breaks at Scale**  
> *"To wrap up, let's discuss what we intentionally simplified and what would break in a large-scale enterprise environment:  
> 1. **Database High Availability**: We used a single-pod Redis deployment. At scale, a single Redis pod is a single point of failure (SPOF). In production, we would use Redis Sentinel or Redis Cluster with Multi-AZ persistent volume replication.  
> 2. **Secret Management**: We stored credentials in base64-encoded Kubernetes Secret YAMLs. In production, committing secrets to Git (even base64) is unsafe. We would integrate **HashiCorp Vault**, **AWS Secrets Manager**, or **SealedSecrets** with External-Secrets-Operator.  
> 3. **Cluster Networking**: We used standard ClusterIP and NodePort services. Production requires an AWS ALB / NGINX Ingress with automated TLS certificate management via `cert-manager` and Let's Encrypt."*

> **[09:45 - 10:30] Future Production Roadmap**  
> *"If I were expanding this stack for a enterprise production environment, I would add:  
> - **GitOps Continuous Deployment**: Replace GitHub Actions direct `kubectl apply` with **ArgoCD** or **FluxCD** for declarative drift detection and automated sync.  
> - **Service Mesh & Progressive Delivery**: Implement **Istio** or **Linkerd** to enable canary deployments, blue-green traffic splitting, and mutual TLS (mTLS).  
> - **Observability Stack**: Deploy **Prometheus**, **Grafana**, and **Loki** for metric scraping, alerting rules, and centralized log aggregation.  
> 
> Thank you for reviewing this DevOps infrastructure challenge submission! All manifests, scripts, and documentation are available in the repository."*

---

## 🎬 Recording Checklist & Pro-Tips

- [x] Clear resolution (1080p 60fps) with readable code font size (16pt+).
- [x] Clear audio recording using noise-suppression filter.
- [x] Live Terminal prompt clean (`PS1="$ "` or clean zsh prompt).
- [x] All 4 sections covered strictly within 8-12 minute timeframe.
