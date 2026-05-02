# Backend Track Submission

**Roll Number:** RA2311026010590  
**GitHub:** https://github.com/tousif632/RA2311026010590

---

## Projects

### 1. Logging Middleware
Reusable TypeScript logging module that sends structured logs to the evaluation server and to console.

**Location:** `logging_middleware/`

### 2. Vehicle Maintenance Scheduler
Optimization microservice using the **0/1 Knapsack algorithm** to select vehicles for maintenance that maximizes total operational impact within a mechanic-hour budget.

**Output:** Maximized operational impact score per depot

**Location:** `vehicle_maintenance_scheduler/`

### 3. Campus Notifications System
Multi-stage notification platform design covering API design, database optimization, reliability patterns, and priority inbox.

**6 Stages:** API Design → Database Schema → Query Optimization → Performance → Reliability → Priority Inbox

**Location:** `notification_system_design.md`

---

## Running the Scheduler

```bash
# Navigate to scheduler directory
cd vehicle_maintenance_scheduler

# Install dependencies
npm install

# Set your access token
cp .env.example .env
# Edit .env and add your ACCESS_TOKEN

# Build TypeScript
npm run build

# Run scheduler
npm start
```

---

## Architecture

```
logging_middleware/               ← Reusable logging for both services
  └── logger.ts                  ← Logger class (sends to evaluation server)

vehicle_maintenance_scheduler/   ← Scheduler microservice
  ├── src/
  │   ├── index.ts               ← Main entry point
  │   ├── api.ts                 ← Depot & vehicle API calls
  │   ├── scheduler.ts           ← 0/1 Knapsack DP algorithm
  │   ├── models.ts              ← TypeScript interfaces
  │   └── config.ts              ← Environment config
  └── README.md

notification_system_design.md    ← 6-stage notification system design
```

---

## Key Features

- ✅ Reusable logging middleware with evaluation server API integration
- ✅ Efficient 0/1 Knapsack algorithm for vehicle scheduling (O(n × capacity))
- ✅ Complete PostgreSQL database design with scaling considerations
- ✅ Query optimization reducing response time from 30s to 50ms
- ✅ Redis caching + pagination for performance
- ✅ Fault-tolerant event-driven architecture with retry logic
- ✅ ML-inspired priority scoring algorithm for notification inbox

---

**Implemented by:** Tousif  
**Date:** May 2, 2026
