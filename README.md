# 🧠 FreshTrack+
### *Smart Food Expiry & Nutrition Tracker – Eat Smart, Waste Less.*

> A responsive AI-powered web app that tracks food expiry dates, provides nutrition insights, and reduces food waste — built for impact, innovation, and a hackathon-winning experience. 🌱✨

---

## 🚀 Overview

**FreshTrack+** is a next-gen web app designed to make food management smarter.  
It combines expiry tracking, barcode/OCR scanning, and nutrition analysis to help users save money, reduce waste, and live healthier.  

---

## 🧩 Features

### 👥 Dual Dashboards
- **Consumer Dashboard:** Track expiry, view nutrition summaries, and get health alerts.  
- **Retailer Dashboard:** Manage stock, apply dynamic discounts for near-expiry items, and view product analytics.

### 📸 Smart Scanning
- Scan **barcodes** or **labels** using OCR to detect product name & expiry date.  
- Automatically logs item into database with expiry and nutrition data.

### 🍏 Nutrition Analyzer
- Fetches nutritional info via **OpenFoodFacts API** (calories, sugar, fat, protein, fiber, etc.).  
- Displays a **Nutrition Summary Card** with:
  - Health score indicator (🟢 Good / 🟡 Moderate / 🔴 High Risk)  
  - AI-generated advice (“Low sugar – healthy choice!”)
- Aggregates daily nutrition summaries across all items.

### ⏰ Expiry Alerts
- ⚠️ 3 days before expiry → “Use Soon”  
- ❌ On expiry → “Expired – dispose safely”  
- ✅ Option to mark as *Consumed* or *Wasted*  

### 🌍 Community & Gamification
- **Share Food Hub:** donate near-expiry items locally.  
- **Achievements:** badges like *Waste Warrior* 🥇 and *Healthy Eater* 💪.

### 🕶️ Dark Mode + Responsiveness
- Fully responsive for mobile & desktop.  
- Dark mode with color adjustments for clear visibility.  
- Smooth transitions and lazy loading for faster page loads.

---

## ⚙️ Tech Stack

| Layer | Technology |
|-------|-------------|
| **Frontend** | Next.js / React + Tailwind CSS |
| **Backend** | Supabase (Auth + Database) |
| **APIs** | OpenFoodFacts, Tesseract.js (OCR), Barcode Scanning |
| **Libraries** | React Query / SWR, Chart.js / Recharts |
| **Hosting** | Vercel / Netlify |
| **Database** | PostgreSQL (via Supabase) |

---

## 🗄️ Database Schema

### **profiles**
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Linked to user |
| email | Text | User email |
| role | Text | `consumer` / `retailer` |
| created_at | Timestamp | Creation date |

### **items**
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Item ID |
| user_id | UUID | Linked to consumer |
| name | Text | Product name |
| purchase_date | Date | Purchase date |
| expiry_date | Date | Expiry date |
| nutrition_data | JSON | Calories, fat, sugar, etc. |
| consumed | Boolean | Item used or not |

### **retailer_products**
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Product ID |
| retailer_id | UUID | Linked to retailer |
| name | Text | Product name |
| expiry_date | Date | Expiry date |
| discount | Numeric | Discount value |
| created_at | Timestamp | Added date |

---

## 🔐 Environment Variables

Add these to `.env.local` or Vercel project settings:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_OPENFOODFACTS_API=https://world.openfoodfacts.org/api/v0/product/
