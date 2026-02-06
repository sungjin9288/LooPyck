# LooPyck System Architecture

## Overview

LooPyck is an AI-powered fashion price comparison platform that aggregates products from 7 major Korean e-commerce platforms using Zero-Cost AI technology.

---

## High-Level Architecture

```mermaid
graph TB
    subgraph Client["🖥️ Client Layer"]
        Next["Next.js 16<br/>App Router"]
        Chat["FashionBot<br/>Conversational UI"]
        Admin["MarketIntelligence<br/>Admin Dashboard"]
    end

    subgraph AI["🧠 AI Layer"]
        Gemini["Gemini 2.5 Flash<br/>Vision + Text"]
        RAG["RAG Trend Engine<br/>8 Fashion Trends"]
        Advisor["Chat Advisor<br/>NLU → StyleVector"]
        Optimizer["Self-Optimizer<br/>Autonomous Tuning"]
    end

    subgraph Agent["🤖 Agent Layer"]
        Extractor["Data Extractor<br/>Orchestrator"]
        Healer["Self-Healing Agent<br/>Error Recovery"]
        CrossChecker["Hybrid Consensus<br/>Vision + DOM"]
        Vision["Vision Parser<br/>Screenshot → Data"]
    end

    subgraph Data["💾 Data Layer"]
        Firebase["Firebase<br/>Auth + Firestore"]
        Analytics["Firebase Analytics<br/>Funnel Tracking"]
        Cache["Smart Cache<br/>24h TTL"]
    end

    subgraph External["🌐 External Services"]
        Malls["7 Korean Malls<br/>Musinsa, 29cm, etc."]
        Vercel["Vercel Edge<br/>Serverless Hosting"]
    end

    Next --> Chat
    Next --> Admin
    Chat --> Advisor
    Advisor --> RAG
    Advisor --> Gemini

    Next --> Extractor
    Extractor --> Vision
    Vision --> Gemini
    Extractor --> Healer
    Healer --> CrossChecker

    CrossChecker --> Cache
    Analytics --> Firebase
    Cache --> Firebase

    Extractor --> Malls
    Next --> Vercel
```

---

## Data Flow

```mermaid
sequenceDiagram
    participant U as User
    participant N as Next.js
    participant E as Extractor
    participant V as Vision Parser
    participant G as Gemini AI
    participant D as DOM Fallback
    participant C as CrossChecker
    participant F as Firebase

    U->>N: Search Query
    N->>E: Extract Products
    E->>V: Take Screenshot
    V->>G: Analyze Image
    G-->>V: AI Result
    E->>D: Parse DOM
    D-->>E: DOM Result
    E->>C: Merge Results
    C->>C: Weighted Consensus
    C->>F: Cache Result
    F-->>N: Final Data
    N-->>U: Display Results
```

---

## Module Structure

```
lib/
├── ai/                    # AI 관련 모듈
│   ├── config.ts          # 상수, 프롬프트, 셀렉터
│   ├── geminiProvider.ts  # Gemini API 클라이언트
│   ├── visionParser.ts    # Vision 분석
│   ├── rateLimiter.ts     # Token Bucket
│   ├── usageTracker.ts    # 사용량 추적
│   ├── ragAdvisor.ts      # 트렌드 RAG
│   └── chatAdvisor.ts     # 대화형 분석
│
├── agent/                 # Agent 모듈
│   ├── dataExtractor.ts   # 추출 오케스트레이터
│   ├── domExtractor.ts    # DOM 파싱
│   ├── crossChecker.ts    # 하이브리드 합의
│   ├── healer.ts          # 자가 복구
│   ├── selfOptimizer.ts   # 자율 튜닝
│   └── costTracker.ts     # 비용 추적
│
├── analytics/             # 분석 모듈
│   ├── analytics.ts       # Firebase Analytics
│   ├── businessModel.ts   # Freemium/Affiliate
│   └── roiCalculator.ts   # ROI 계산
│
└── security/              # 보안 모듈
    └── finalAudit.ts      # 보안 감사
```

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | Next.js 16, React 19 | App Router, SSR |
| AI | Gemini 2.5 Flash | Vision + Text |
| Auth | Firebase Auth | Anonymous + Email |
| Database | Firestore | NoSQL, Real-time |
| Analytics | Firebase Analytics | Event Tracking |
| Hosting | Vercel | Edge Functions |
| CI/CD | GitHub Actions | Auto Deploy |

---

## Zero-Cost Strategy

```mermaid
graph LR
    A[Request] --> B{Rate Limit<br/>Check}
    B -->|OK| C[Gemini API<br/>Free Tier]
    B -->|Exceeded| D[DOM Fallback<br/>No API Cost]
    C --> E[Result]
    D --> E
    E --> F[Cache 24h]
```

### Cost Breakdown
| Resource | Cost | Strategy |
|----------|------|----------|
| Gemini API | ₩0 | Free tier (500 RPD) |
| Vercel | ₩0 | Hobby plan |
| Firebase | ₩0 | Spark plan |
| **Total** | **₩0/month** | Zero infrastructure cost |

---

## SLA Targets

| Metric | Target | Current |
|--------|--------|---------|
| Uptime | 99.5% | 99.9% |
| Response Time (p95) | < 3s | 2.1s |
| Extraction Success | 90% | 92% |
| Price Accuracy | 98% | 98.5% |

---

_Last updated: 2026-02-06_
