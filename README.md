


> “We’re driving Africa’s clean mobility revolution — one shared EV at a time.”








# ⚡ Freenergy Tech – FleetFi

### Tokenized EV Fleet Management & Biogas-Powered Swap Infrastructure

Freenergy Tech (FT) is redefining how Africa powers and owns clean mobility.  
We make **electric vehicles affordable for everyone** — by enabling **fractional ownership**, efficient **fleet management**, and **biogas-powered battery swap infrastructure**.

---

## 🚀 Overview

FleetFi is FT’s pilot application built for the **Ilorin Innovation Hackathon 2025**, designed to demonstrate how electric tricycles (E-Keke) can be co-owned, operated, and monetized through tokenized fleet management.

Through FleetFi:
- **Investors** co-own electric vehicles and earn ROI from daily operations.
- **Riders** earn income without owning a vehicle.
- **FT** manages fleet logistics and swap operations, taking a share of swap revenues.

This creates a **sustainable circular ecosystem** — where energy, transport, and capital flow together.

---

## 🧩 How It Works

1. **Fractional EV Ownership:**  
   Investors buy tokens representing shares in specific EVs.

2. **Fleet Operations:**  
   FT deploys EVs to verified riders and manages performance data through IoT telemetry.

3. **Battery Swaps:**  
   Riders use FT’s biogas-powered swap stations instead of fuel stations — clean, fast, affordable.

4. **Revenue Sharing:**  
   Daily earnings are split between investors, riders, and FT via transparent smart contracts.

---

## 💡 Hackathon MVP Scope

The MVP simulates the core workflows of FleetFi:

| Function | Description |
|-----------|--------------|
| Investor Dashboard | Shows tokenized EVs, expected ROI, and active investment rounds. |
| Operator Dashboard | Manages vehicles, riders, and swap performance metrics. |
| SLX Marketplace | Mock secondary market for investors to buy/sell EV ownership tokens. |
| ESG Tracker | Displays carbon reduction and impact metrics. |

🎥 **Demo Video (40s)**  
▶ [Watch FleetFi Prototype on Loom](https://www.loom.com/share/cfc0392a22ab434d9ff51a83ec28ca16)

📂 **Google AI Studio Prototype:**  
[Open App Demo](https://ai.studio/apps/drive/1Ji3Lj5fUkFlGPiTY2Y0YTiPY-lPIjqB7)

---

## ⚙️ Architecture

FleetFi’s design integrates a mock simulation of blockchain tokenization, with a clear path to full deployment.

**Architecture Layers:**
- **Frontend:** Google AI Studio (No-code prototype, integrated with mock data)
- **Backend:** Mock database simulating token registry & telemetry logs
- **Telemetry:** Placeholder data modeled from Qoray API schema
- **Blockchain (Future):** Trovotech × Bantu Network integration (SEC sandbox-ready)

![FleetFi Architecture](./images/dashboard_screenshot.png)

---

## 🔗 Integration with Trovotech

Freenergy Tech’s tokenization framework will connect to **Trovotech’s SEC-ARIP-licensed VASP infrastructure** to ensure all EV and swap-station assets are legally compliant for fractional ownership and investor payouts.

For full details on API endpoints, compliance model, and trustee workflows:  
👉 [Trovotech Integration & Compliance Architecture](./docs/TROVOTECH_INTEGRATION.md)

---

## 🌍 Market Opportunity

Nigeria’s 3M+ commercial tricycles spend **₦5 trillion yearly on petrol** — FleetFi replaces that with **renewable battery swapping**.  
Ilorin (pilot city) provides the testbed for a **biogas-powered EV swap network** before scaling nationally.

---

## 🧠 Roadmap

| Phase | Timeline | Key Milestones |
|--------|-----------|----------------|
| **Pilot** | Q1 2025 | Launch 3 E-Kekes + 1 biogas swap station |
| **Scale-Up** | Q2–Q3 2026 | Expand to 6 EVs + 3 swap hubs; onboard 50+ investors |
| **Commercial Rollout** | 2027 | Integrate with Trovotech sandbox, onboard 200+ token holders |
| **Regional Expansion** | 2028 | Enter Ghana, Kenya, Côte d’Ivoire; MRV carbon certification |

---

## 👥 Team

| Name | Role | LinkedIn |
|------|------|-----------|
| **Akinwumi Oyebode** | Founder & CEO – Clean-tech innovator with expertise in biogas systems & decentralized energy | [LinkedIn](https://www.linkedin.com/in/akin-oye-11b9ab163/) |
| **Esther Orok-Ekemini** | Co-founder, Legal & Compliance – Background in international law and SEC asset regulation | [LinkedIn](https://www.linkedin.com/in/estherorokekemini) |
| **Fii Stephen Michael** | Co-founder, Strategy & Growth – Startup strategist & ecosystem builder | [LinkedIn](https://www.linkedin.com/in/fiistephenmichael) |
| **Ann Enen Agbo** | Marketing Lead – Investor Relations & Community Outreach | [LinkedIn](https://www.linkedin.com/in/anneneagbo/) |

---

## 💬 Ask

We are seeking:
- **₦2 million grant support** from the Hackathon to finalize integrations and mobile app rollouts.  
- **₦20 million seed raise (for 10% equity)** to launch our 6-EV + biogas-powered swap pilot and onboard ₦20M in tokenized assets.

---

## 💚 Our Impact

- Creates jobs for **women riders** and renewable technicians (40% women riders policy).  
- Converts organic waste to biogas, reducing emissions.  
- Enables **inclusive climate finance** through co-ownership.

---

## 📞 Contact

📧 freenergytech@gmail.com  , freenergy2023@gmail.com
🌍 [Website (coming soon)](https://freenergy.tech)  
📍 Ilorin, Nigeria  
© 2025 Freenergy Tech

---

## 🧾 License

This project is licensed under the MIT License — free for educational and hackathon use.














/docs/FleetFi_Solution_Architecture.md


# FleetFi Solution Architecture — How It Works

FleetFi connects electric vehicle investors, fleet operators, and riders through a tokenized co-ownership platform.

## Core System Flow
1. **Investor Interface (FleetFi Dashboard)**
   - Investors buy fractional ownership of electric vehicles via the dashboard.
   - Each share (token) represents a % ownership of an EV asset and its revenue rights.

2. **Vehicle and Operations Layer**
   - Vehicles are registered in FleetFi’s database with unique IDs and telemetry inputs (battery %, distance, swap count).
   - Fleet operations and swap activities (powered by biogas-based energy stations) are logged in real time.

3. **Revenue and Tokenization Logic**
   - Each completed ride generates revenue.
   - The system simulates automatic allocation of earnings into a shared pool for:
     - EV investors (ROI)
     - Riders (income)
     - FT (management and maintenance fees)

4. **Blockchain & Custody Integration (via Trovotech)**
   - In full deployment, Trovotech’s SEC-aligned tokenization API will issue asset-backed tokens.
   - Tokens will be held under a **Trustee-Custody Layer**, ensuring investor protection and legal compliance.
   - Future integration will use **Bantu blockchain** for transparent asset registry and ROI disbursement.

## Architecture Diagram
![FleetFi × Trovotech Integration — Custody and Tokenization Flow](./docs/FT_Trovotech_Architecture.png)

## Tech Stack
- **Frontend:** Google AI Studio / Bubble MVP (UI logic)
- **Backend:** Firebase mock + API logic for rides & swaps
- **Data Simulation:** Telemetry CSV + Admin Dashboard
- **Future Integration:** Trovotech API, Qoray IoT feed, Trustee node










# FleetFi User Journey Map

## 1. Investor Journey
- **Goal:** Earn ROI by co-owning EVs.
1. Logs in on FleetFi dashboard.
2. Views available EVs and tokenized shares.
3. Buys fractional ownership (mock token purchase).
4. Tracks returns and swap activity.
5. Receives ROI updates monthly (future blockchain link).

## 2. Rider Journey
- **Goal:** Earn daily income by driving an FT-managed EV.
1. Registers with FT fleet operator.
2. Gets assigned a vehicle.
3. Swaps batteries at biogas-powered stations.
4. Income auto-logged and payout simulated.

## 3. Operator Journey
- **Goal:** Manage fleet efficiency and station uptime.
1. Uses the operator dashboard.
2. Monitors battery levels, location, and status.
3. Logs maintenance and charging operations.
4. Reports profit summaries to investors.

## User Experience Flow Summary
Investor → FleetFi Platform → Fleet Operation → Swap Station → Rider → Revenue Distribution → Investor







# FleetFi Post-Bootcamp Action Plan

## Phase 1: (Nov–Dec 2025) — Prototype Expansion
- Integrate real Qoray IoT telemetry feed for vehicle data.
- Implement Trovotech sandbox for token issuance test.
- Recruit 3 female riders for pilot testing in Ilorin.

## Phase 2: (Q1 2026) — Pilot Launch
- Deploy 6 EV tricycles (E-Keke) under co-ownership structure.
- Launch first biogas-powered swap station (5m³ digester).
- Activate investor dashboard beta for 20 token holders.

## Phase 3: (Q2–Q3 2026) — Regulatory & Scale-up
- Finalize trustee partnership under SEC-compliant model.
- Raise ₦20M pre-seed to scale to 20+ EVs and 3 swap hubs.
- Franchise swap operations with OEM partnerships.

## Phase 4: (Q4 2026+) — National Rollout
- Expand to 5 Nigerian states.
- Integrate ESG & carbon tracking for investor reporting.
- Launch regional investor portal (FleetFi Africa).

**Key Success Metrics:**
- 50+ riders onboarded (40% women)
- ₦100M in tokenized EV assets
- 3 biogas swap hubs operational

