# Campus Notifications System — Complete Design Document

**Roll Number:** RA2311026010590  
**GitHub:** https://github.com/tousif632/RA2311026010590

---

## Stage 1: REST API Design

### Endpoints

#### 1. Send Notification
```
POST /api/notifications/send
```

**Request:**
```json
{
  "recipientIDs": ["1042", "1043"],
  "message": "Your placement results are out",
  "type": "Result"
}
```

**Response:**
```json
{
  "notificationID": "notif-abc123",
  "timestamp": "2026-05-02T10:30:00Z",
  "status": "sent",
  "totalRecipients": 2
}
```

---

#### 2. Fetch Unread Notifications
```
GET /api/notifications?studentID=1042&isRead=false&limit=20&offset=0
```

**Response:**
```json
{
  "notifications": [
    {
      "id": "notif-001",
      "studentID": "1042",
      "type": "Result",
      "message": "Mid-sem results are published",
      "timestamp": "2026-05-02T10:30:00Z",
      "isRead": false
    }
  ],
  "total": 1
}
```

---

#### 3. Mark Notification as Read
```
PUT /api/notifications/:id/read
```

**Response:**
```json
{
  "updated": true
}
```

---

#### 4. Get Priority Notifications
```
GET /api/notifications/priority?studentID=1042&limit=10
```

**Response:**
```json
{
  "notifications": [
    {
      "id": "notif-p1",
      "type": "Placement",
      "message": "Congratulations! Google offer received",
      "priorityScore": 9.8,
      "rank": 1
    }
  ]
}
```

---

### JSON Schema

```json
{
  "type": "object",
  "properties": {
    "id":         { "type": "string" },
    "studentID":  { "type": "string" },
    "type":       { "enum": ["Event", "Result", "Placement"] },
    "message":    { "type": "string" },
    "timestamp":  { "type": "string", "format": "date-time" },
    "isRead":     { "type": "boolean" },
    "createdAt":  { "type": "string", "format": "date-time" },
    "priority":   { "type": "integer", "minimum": 0, "maximum": 10 }
  },
  "required": ["id", "studentID", "type", "message", "timestamp"]
}
```

---

## Stage 2: Database Schema

### Chosen Database: PostgreSQL (Relational)

**Reason:**
1. ACID compliance — notifications must be consistent
2. Complex filter queries — studentID + type + timestamp
3. Rich indexing support — essential for 50M+ notifications
4. Proven scalability to billions of rows

### SQL Schema

```sql
-- Students table
CREATE TABLE students (
  id         VARCHAR(50)  PRIMARY KEY,
  email      VARCHAR(100) NOT NULL UNIQUE,
  name       VARCHAR(100) NOT NULL,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE notifications (
  id         VARCHAR(50)                       PRIMARY KEY,
  studentID  VARCHAR(50)                       NOT NULL,
  type       ENUM('Event', 'Result', 'Placement') NOT NULL,
  message    TEXT                              NOT NULL,
  isRead     BOOLEAN                           DEFAULT FALSE,
  createdAt  TIMESTAMP                         DEFAULT CURRENT_TIMESTAMP,
  timestamp  TIMESTAMP                         DEFAULT CURRENT_TIMESTAMP,
  priority   INT                               DEFAULT 0,
  FOREIGN KEY (studentID) REFERENCES students(id),
  INDEX idx_student_read    (studentID, isRead),
  INDEX idx_timestamp       (createdAt DESC)
);

-- Notification type weights (for priority inbox)
CREATE TABLE notification_types (
  type        ENUM('Event', 'Result', 'Placement') PRIMARY KEY,
  weight      INT          NOT NULL,
  description VARCHAR(255)
);

INSERT INTO notification_types VALUES
  ('Placement', 10, 'Highest priority — placement offers'),
  ('Result',     8, 'High priority — academic results'),
  ('Event',      5, 'Normal priority — campus events');
```

### Scalability Discussion

**Current Scale:** 50,000 students × 5,000,000 notifications = 250 billion potential rows

**Problems at Scale:**
1. **Query Performance:** `SELECT * FROM notifications WHERE studentID = ?` does a full scan — 30+ seconds
2. **Memory Pressure:** Loading 5M rows into RAM exhausts server memory
3. **Disk I/O:** Each unindexed query causes multiple disk reads
4. **Lock Contention:** Concurrent writes cause table-level locks and slowdowns

**Solutions:**

| Solution | Description | Benefit |
|----------|-------------|---------|
| Composite Indexing | Index on `(studentID, isRead, timestamp)` | Full scan → 50ms |
| Table Partitioning | Split by date ranges (monthly tables) | Only scan relevant partition |
| Redis Caching | Cache per-student unread list (5 min TTL) | DB load reduced 95% |
| Data Archival | Move notifications >6 months to archive table | Main table stays lean |

---

## Stage 3: Query Optimization

### Original Slow Query
```sql
SELECT * FROM notifications
WHERE studentID = 1042 AND isRead = false
ORDER BY createdAt DESC;
```

**Problems:**
- No index → full table scan over 5M rows
- `SELECT *` fetches unnecessary columns
- No date filter → retrieves years of old notifications
- No `LIMIT` → could return 1M rows

**Estimated Time:** 30+ seconds ❌

### Optimized Query
```sql
SELECT id, type, message, timestamp
FROM notifications
WHERE studentID = 1042
  AND isRead = false
  AND createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
ORDER BY createdAt DESC
LIMIT 50;
```

**Improvements:**
1. Uses composite index `(studentID, isRead, createdAt)` → no full scan
2. Selects only 4 needed columns → less network/memory overhead
3. Filters last 7 days only → covers 99% of user use-cases
4. `LIMIT 50` → pagination prevents fetching millions of rows

**Estimated Time:** ~50ms ✅ (600× faster)

### Required Index
```sql
CREATE INDEX idx_notifications_user_read_time
ON notifications(studentID, isRead, createdAt DESC);
```

### Why the Original Was Slow
1. **Full Table Scan** — without an index, PostgreSQL checks every single row
2. **Memory Pressure** — millions of rows loaded into working memory
3. **Disk Sort** — `ORDER BY` on an un-indexed column requires a disk-based sort pass
4. **Network Overhead** — `SELECT *` sends all columns across the wire

---

## Stage 4: Performance Solutions

### Problem
50,000 students fetching notifications on every page load overwhelms the database.

### Option 1: Redis Caching
```
Cache unread notifications per student for 5 minutes

Key: "student:{id}:unread:page:{n}"
Value: JSON array of notifications
TTL: 300 seconds

Flow:
  Request → Check Redis
    ├── HIT  → Return instantly (<1ms)
    └── MISS → Query DB → Cache result → Return
```
✅ Very fast (<1ms cached) | ❌ Up to 5 min stale data

### Option 2: Pagination
```
Load 20 notifications per page (infinite scroll)

Page 1 → first 20
User scrolls → Page 2 → next 20
...
```
✅ Low DB load | ❌ User must scroll to see older items

### Option 3: Materialized View
```
Pre-compute summary every hour

students_notification_summary:
  studentID | unread_count | last_notification_at
```
✅ Always fast | ❌ Data is 1 hour stale

### ✅ Recommended: Redis Caching + Pagination

```typescript
async function getUnreadNotifications(studentID: string, page = 1) {
  // Try Redis cache first
  const cacheKey = `student:${studentID}:unread:page:${page}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    console.log('Cache HIT');
    return JSON.parse(cached);
  }

  // Cache miss — query DB with pagination
  const limit = 20;
  const offset = (page - 1) * limit;

  const notifications = await db.query(`
    SELECT id, type, message, timestamp
    FROM notifications
    WHERE studentID = ? AND isRead = false
    ORDER BY timestamp DESC
    LIMIT ? OFFSET ?
  `, [studentID, limit, offset]);

  // Cache for 5 minutes
  await redis.setex(cacheKey, 300, JSON.stringify(notifications));
  return notifications;
}
```

### Performance Comparison

| Approach             | First Load | Cached Load | DB Queries/Hour | Memory |
|----------------------|-----------|-------------|-----------------|--------|
| No Cache             | 2 seconds | 2 seconds   | 3000            | High   |
| Redis Only           | 2 seconds | <10ms       | 600             | Medium |
| Pagination Only      | 500ms     | 500ms       | 3000            | Low    |
| **Redis + Pagination** | **500ms** | **<10ms** | **600**         | **Low** |

---

## Stage 5: Reliability & Fault Tolerance

### Problem
Original `notify_all()` is not atomic:

```
for each student:
  send_email()        ← if this fails, stop
  save_to_db()        ← not reached
  push_app_notif()    ← not reached

Result: email sent but no DB record → inconsistent state
```

### Solution: Event-Driven Architecture with Message Queue

**Components:**
1. **Notification Controller** — receives POST request, publishes event
2. **Message Queue** (RabbitMQ / Kafka) — stores events reliably
3. **Worker** — consumes events and processes each student atomically
4. **Retry Queue** — catches failed notifications for automatic retry

**Flow:**
```
POST /notify-all
  ↓
Controller publishes event to queue
  ↓
Returns 202 Accepted immediately
  ↓
Worker picks up event
  ↓
  For each student:
    DB transaction {
      send_email()
      save_to_db()
      push_app_notification()
    }
    ├── All succeed → mark as sent
    └── Any fail   → publish to retry queue
```

**Controller:**
```typescript
async notifyAll(studentIDs: string[], message: string) {
  await messageQueue.publish('notification.send', {
    studentIDs,
    message,
    timestamp: Date.now(),
    requestID: uuid()
  });
  return { status: 'queued', requestID: 'task-123' };
}
```

**Worker:**
```typescript
async processNotificationEvent(event) {
  for (const studentID of event.studentIDs) {
    try {
      await db.transaction(async (trx) => {
        await sendEmail(studentID, event.message);
        await saveToDatabase(studentID, event.message, trx);
        await pushAppNotification(studentID, event.message);
      });
      await logger.info('service', `Notification sent to ${studentID}`);
    } catch (error) {
      await messageQueue.publish('notification.retry', {
        studentID,
        message: event.message,
        attempt: 1,
        error: error.message
      });
      await logger.error('service', `Failed to notify ${studentID}: ${error.message}`);
    }
  }
}
```

**Key Benefits:**
1. **Atomicity** — DB transaction ensures all 3 operations succeed or all fail
2. **Durability** — Queue persists events even if the app crashes
3. **Retry Logic** — Failed notifications are automatically retried
4. **Scalability** — Multiple workers process notifications in parallel
5. **Observability** — Track notification status via requestID

**Failure Scenarios:**

| Scenario | Behaviour |
|----------|-----------|
| Email fails | DB transaction rolls back; event pushed to retry queue |
| App crashes mid-loop | Queue persists events; worker resumes on restart |
| Database down | Worker waits for DB recovery; no notifications lost |

---

## Stage 6: Priority Inbox Implementation

### Problem
Users receive 100+ notifications. Hard to find important ones.

### Priority Score Formula

```
Priority Score = (Weight × Recency × Importance) / (1 + Age Days)

Where:
  Weight     = type importance  (Placement=10, Result=8, Event=5)
  Recency    = exp(-ageDays/7)  (exponential time-decay over 7 days)
  Importance = read factor      (unread=1.0, read=0.5)
  Age Days   = days since notification was created
```

### Example Calculations

| Notification | Type | Age | Read? | Score |
|---|---|---|---|---|
| Placement offer, today, unread | Placement | 0d | No | `(10 × 1.0 × 1.0) / 1 = 10.0` |
| Mid-sem result, 3 days, read | Result | 3d | Yes | `(8 × 0.64 × 0.5) / 4 = 0.64` |
| Event, 7 days ago, unread | Event | 7d | No | `(5 × 0.37 × 1.0) / 8 = 0.23` |

**Ranking:** Placement (10.0) → Result (0.64) → Event (0.23)

### TypeScript Implementation

```typescript
interface PriorityNotification {
  id: string;
  studentID: string;
  type: 'Event' | 'Result' | 'Placement';
  message: string;
  timestamp: Date;
  isRead: boolean;
  priority: number;
}

class PriorityService {
  private typeWeights = { 'Placement': 10, 'Result': 8, 'Event': 5 };

  calculatePriorityScore(notif: PriorityNotification): number {
    const weight       = this.typeWeights[notif.type] || 1;
    const ageInDays    = (Date.now() - notif.timestamp.getTime()) / (1000 * 60 * 60 * 24);
    const recency      = Math.exp(-ageInDays / 7);
    const importance   = notif.isRead ? 0.5 : 1.0;
    return (weight * recency * importance) / (1 + ageInDays);
  }

  async getTopPriorityNotifications(
    studentID: string,
    notifications: PriorityNotification[],
    limit = 10
  ): Promise<PriorityNotification[]> {
    const scored = notifications.map(n => ({
      ...n,
      _score: this.calculatePriorityScore(n)
    }));

    return scored
      .sort((a, b) => b._score - a._score)
      .slice(0, limit)
      .map(({ _score, ...notif }) => notif);
  }
}
```

### Sample Output

```json
{
  "studentID": "1042",
  "priorityNotifications": [
    {
      "rank": 1,
      "id": "notif-p1",
      "type": "Placement",
      "message": "Congratulations! Google offer",
      "timestamp": "2026-05-02T10:00:00Z",
      "isRead": false
    },
    {
      "rank": 2,
      "id": "notif-r1",
      "type": "Result",
      "message": "Your mid-sem results are published",
      "timestamp": "2026-04-29T15:30:00Z",
      "isRead": false
    }
  ]
}
```
