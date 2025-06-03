# 📘 Software Requirements Specification (SRS)

---

## 1. **Project Overview**

**Project Name:** Nutrivault
**Type:** Full-Stack Web App
**Purpose:** To provide users with accurate nutritional data and intelligent meal suggestions based on their search queries and dietary goals.

---

## 2. **Objectives**

* Allow users to search food items and retrieve nutritional information.
* Display macro & micronutrients in an easy-to-understand format (text + charts).
* Enable optional history tracking and meal logging.
* Provide intelligent meal recommendations (future expansion).
* Create a production-ready frontend (React) and backend (Flask).

---

## 3. **Target Users**

* Health-conscious individuals
* Fitness enthusiasts
* Nutritionists and diet planners
* Casual users looking to eat smarter

---

## 4. **Functional Requirements**

### 4.1 Food Search

* ✅ Input: food name
* ✅ Output: top 5–10 USDA search results

### 4.2 Food Details View

* ✅ Calories
* ✅ Macronutrients (Protein, Carbs, Fat)
* ✅ Micronutrients (Vitamins, Minerals)
* ✅ Portion size info

### 4.3 Nutrition Visualization

* ✅ Pie chart for macro distribution
* ✅ Optional bar/line chart for micronutrients

### 4.4 Search History / Meal Log

* ✅ Store last 10 searched items (frontend state or local DB)
* ✅ Time of access
* ⬜️ Optional: add quantity eaten and track total intake

### 4.5 Recommendations (Future Scope)

* ⬜️ Suggest meals based on user dietary goals
* ⬜️ Smart alerts for excessive intake (sodium, sugar, etc.)

---

## 5. **Non-Functional Requirements**

* Responsive, mobile-first UI
* Fast API response times (via caching)
* Secure API key handling (Flask backend)
* Modular, clean codebase
* Deployable via Render (Flask) and Vercel (React)

---

## 6. **Tech Stack**

| Layer       | Technology                      |
| ----------- | ------------------------------- |
| Frontend    | React (Vite)                    |
| Styling     | TailwindCSS                     |
| Charts      | Chart.js / Recharts             |
| HTTP Client | Axios                           |
| Backend     | Flask                           |
| API Source  | USDA FoodData Central API       |
| Storage     | JSON/SQLite (for history)       |
| Deployment  | Vercel (React) + Render (Flask) |

---

## 7. **UI Pages / Components**

| Page/Component       | Description                                     |
| -------------------- | ----------------------------------------------- |
| `SearchBar.jsx`      | Debounced search input with live API querying   |
| `FoodCard.jsx`       | Card view with food title, calories, and macros |
| `NutritionChart.jsx` | Chart for macro split (Pie)                     |
| `HistoryTable.jsx`   | Optional: list of previously searched items     |
| `App.jsx`            | Main page tying everything together             |

---

## 8. **API Design (Flask)**

| Route                 | Method | Description                        |
| --------------------- | ------ | ---------------------------------- |
| `/api/search/<query>` | GET    | Search for food using USDA API     |
| `/api/food/<fdcId>`   | GET    | Get detailed data for a food item  |
| `/api/history`        | GET    | Get user search history (optional) |
| `/api/history`        | POST   | Add a food item to history         |

---

## 9. **USDA API Reference**

* Base URL: `https://api.nal.usda.gov/fdc/v1/`
* Endpoints used:

  * `/foods/search?query=banana`
  * `/food/<fdcId>`

---

## 10. **Milestones & Development Plan**

| Day   | Goal                                                                                           |
| ----- | ---------------------------------------------------------------------------------------------- |
| Day 1 | ✅ Setup Flask + React boilerplate, integrate USDA search                                       |
| Day 2 | ✅ Build React UI: search, food cards                                                           |
| Day 3 | ✅ Add nutrition charts, style with Tailwind                                                    |
| Day 4 | ✅ Add optional history table (local or backend)                                                |
| Day 5 | ✅ Polish UI/UX, add error handling, deploy                                                     |
| Day 6 | ✅ Record Loom video: walkthrough of features, architecture, codebase, deployment, improvements |

---

## 11. **What It Should Have (Core)**

* ✅ Real-time food search
* ✅ Display of calories, macros, micros
* ✅ Nutrition visualization
* ✅ Clean and responsive UI
* ✅ Deployed and demoable

---

## 12. **What More It Could Have (Expansion)**

* ⬜️ User authentication (login/signup)
* ⬜️ Persistent meal history with calories per day
* ⬜️ Dietary goal tracking (weight loss, muscle gain)
* ⬜️ Smart AI meal recommendations
* ⬜️ PDF export of nutritional reports
* ⬜️ Barcode scanner (via camera API)

---
