
# On-time-delivery-AI-agent

### **Overview**
On-time-delivery-AI-agent is an AI-powered proof-of-concept (POC) designed to compress the entire Operations analytics workflow into an instant, automated process. Developed using **Google Gemini** and **Google AI Studio**, this agent transforms raw operational "noise" (messy CSVs, late orders, broken SLAs) into high-level strategic intelligence and actionable root-cause insights.

---

### **🚀 The Challenge: From Data to Decisions**
* **The Problem:** Operations teams often lose days cleaning messy data or manually digging through SQL tables to explain why KPIs dipped.
* **The Goal:** Build an "Actionable Intelligence" engine that automates data quality checks, KPI aggregation, anomaly detection, and Weekly Business Review (WBR) reporting.
* **The Vision:** Enable the Operator to act as the analyst, architect, and automation engine simultaneously.

---

### **🛠️ Technical Architecture & Workflow**
* **Intelligence Layer:** Leverages **Google Gemini API** for reasoning and natural language summaries.
* **Data Gatekeeper:** Integrated row-by-row validation for nulls, impossible coordinates, and negative delivery times (generating a 0-100% Quality Score).
* **Command Center:** Local-first browser analytics for instant KPI aggregation (On-Time Delivery, Order Accuracy) without a heavy backend.
* **Conversational Analytics:** RAG-lite integration allowing users to query data in natural language (e.g., *"What changed in Week 38?"*).

---

### **💡 Key Features**
* **Alerts → AI Actions:** Triggers when KPIs drop below targets; Gemini analyzes the context to recommend specific operational fixes (e.g., "Audit scan compliance").
* **Automated Executive Briefs:** One-click generation of a complete **Weekly Business Review (WBR)** including Executive Summaries, Risks, and Strategic Recommendations.
* **Multi-Mode Flexibility:** Toggle between Sandbox Mode (Google AI Studio) and simulated Enterprise Mode (Vertex AI alignment).

---

### **📈 Strategic Impact (Ops + AI + Analytics)**
* **Shortened Analysis Cycles:** Reduced analysis and reporting cycles from days to seconds.
* **Operational Leverage:** Automated the repetitive narrative work of WBRs, allowing teams to focus on scaling without increasing headcount.
* **Data Discipline:** Forced data quality standards before visualization to ensure judgment is never based on "bad data."

---

### **📂 Project Structure**
```text
├── data/               # Raw delivery CSVs & Sample datasets
├── notebooks/          # Logic for Anomaly Detection & RCA
├── scripts/            # Google Gemini API integration & Data validation
├── reporting/          # Auto-generated WBR templates
└── README.md           # Project Documentation
# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1pANj_HOO2OiXvlKA7s4MZOib14JBCtxM

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
