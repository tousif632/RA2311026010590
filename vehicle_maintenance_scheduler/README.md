# Vehicle Maintenance Scheduler

A TypeScript microservice that optimizes vehicle maintenance scheduling using the **0/1 Knapsack algorithm**.

## Problem
Given a list of vehicles (each with a maintenance duration and an operational impact score) and a mechanic-hour budget per depot, select the optimal subset of vehicles to maximize total impact within the budget.

## Algorithm
**0/1 Knapsack (Dynamic Programming)**
- Time complexity: O(n × capacity)
- Space complexity: O(n × capacity)

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Token
Create a `.env` file in this directory:
```
ACCESS_TOKEN=your-access-token-here
```

### 3. Build & Run
```bash
# Build TypeScript
npm run build

# Run the scheduler
npm start

# Or run in dev mode (no build needed)
npm run dev
```

## Project Structure
```
vehicle_maintenance_scheduler/
├── src/
│   ├── index.ts       ← Main entry point
│   ├── api.ts         ← Depot & vehicle API calls
│   ├── scheduler.ts   ← 0/1 Knapsack algorithm
│   ├── models.ts      ← TypeScript interfaces
│   └── config.ts      ← Environment config
├── package.json
├── tsconfig.json
└── README.md
```

## Output Example
```json
[
  {
    "depotID": 1,
    "selectedVehicles": [
      { "TaskID": "task-001", "Duration": 10, "Impact": 50 }
    ],
    "totalDuration": 10,
    "totalImpact": 50,
    "mechanicHoursBudget": 60,
    "utilizationPercent": 17
  }
]
```
