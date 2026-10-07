# Complete System Architecture Analysis
*Generated: May 1, 2026*

---

## TASK 1 — IDENTIFY ENTITIES

### All Collections (Entities)

#### 1. **User**
```
Collection: users
Description: Authentication and access control for all user types

FIELDS:
├─ name: String (required, min 2 chars)
├─ email: String (required, unique, lowercase)
├─ registrationNumber: String (unique, sparse — only for students)
├─ teacherId: String (unique, sparse — only for faculty/admin)
├─ passwordHash: String (required, min 6 chars, not returned by default)
├─ role: String (required)
│  └─ enum: ['admin', 'faculty', 'student', 'hod']
│  └─ default: 'student'
├─ classroomId: ObjectId (ref: Classroom, default: null)
├─ isActive: Boolean (default: true)
├─ isFirstLogin: Boolean (default: true)
├─ courseType: String (enum: ['BTech', 'MTech'], default: 'BTech')
├─ specialization: String (enum: [null, 'AIML', 'CST', 'CNIS'], default: null)
├─ createdAt: Date (timestamp)
└─ updatedAt: Date (timestamp)

RELATIONSHIPS:
├─ classroomId → Classroom (many-to-one)
└─ Used in Issue.createdBy, Issue.assignedTo
   Used in Classroom.cr, Classroom.lr, Classroom.facultyList
   Used in Project.facultyId, Project.teamMembers[].userId
   Used in Timetable.uploadedBy
   Used in Lab.incharge

NOTES:
└─ Pre-save hook hashes passwordHash before storage
└─ Sparse indexes allow null for non-applicable roles
└─ courseType/specialization only for students
```

---

#### 2. **Classroom**
```
Collection: classrooms
Description: Academic class structure (BTech/MTech cohorts)

FIELDS:
├─ course: String (required)
│  └─ enum: ['BTech', 'MTech']
├─ specialization: String (required, uppercase)
│  └─ example: 'CSE', 'ECE', 'ME'
├─ year: Number (required)
│  └─ Validation: 1-4 for BTech, 1-2 for MTech
├─ section: String (required, uppercase)
│  └─ example: 'A', 'B', 'C'
├─ block: String (required)
│  └─ enum: ['Main Block', 'Algorithm Block']
├─ room: ObjectId (ref: Room, required)
├─ department: String (required)
├─ programDuration: Number (default: 4)
├─ cr: ObjectId (ref: User, default: null)
│  └─ Class Representative
├─ lr: ObjectId (ref: User, default: null)
│  └─ Lab Representative
├─ facultyList: [ObjectId] (ref: User array)
├─ createdAt: Date (timestamp)
└─ updatedAt: Date (timestamp)

UNIQUE CONSTRAINT:
└─ Compound index: { course, specialization, year, section } → UNIQUE

RELATIONSHIPS:
├─ room → Room (one-to-one)
├─ cr → User (optional)
├─ lr → User (optional)
├─ facultyList → [User]
├─ Used in User.classroomId (many students per classroom)
├─ Used in Issue (category='academic')
├─ Used in Project.classroomId
├─ Used in Timetable.classroomId (one per classroom)
└─ Used in Utility.classroomId
```

---

#### 3. **Room**
```
Collection: rooms
Description: Physical classroom locations

FIELDS:
├─ number: String (required, unique)
│  └─ example: 'A01', 'A02', 'B01'
├─ block: String (required)
│  └─ enum: ['Main Block', 'Algorithm Block']
├─ assignedTo: ObjectId (ref: Classroom, default: null)
│  └─ null = available, filled = assigned to classroom
├─ capacity: Number (default: 60)
├─ description: String (default: '')
├─ amenities: [String]
│  └─ enum: ['Projector', 'AC', 'Whiteboard', 'Smart Board', 'Lab Equipment']
├─ isActive: Boolean (default: true)
├─ createdAt: Date (timestamp)
└─ updatedAt: Date (timestamp)

INDEXES:
├─ { block: 1 }
├─ { assignedTo: 1 }
└─ { block: 1, assignedTo: 1, isActive: 1 }

RELATIONSHIPS:
└─ assignedTo → Classroom (optional, one-to-one)
```

---

#### 4. **Asset**
```
Collection: assets
Description: Physical classroom assets (inventory)

FIELDS:
├─ type: String (required)
│  └─ enum: ['Bench', 'Fan', 'LED Board', 'Projector', 'AC', 
│           'Whiteboard', 'Smart Board', 'Computer', 'Chair', 'Desk',
│           'Speaker', 'CCTV', 'Router', 'Printer', 'UPS', 'Other']
├─ block: String (required)
│  └─ enum: ['Department', 'Algorithm']
├─ room: String (required, uppercase)
│  └─ example: 'A01', 'A02'
├─ total: Number (required, min: 1)
│  └─ Total quantity stored in DB
├─ createdAt: Date (timestamp)
└─ updatedAt: Date (timestamp)

COMPUTED FIELDS (virtual, NOT stored):
├─ damaged: Number
│  └─ Sum of quantity from ACTIVE (non-resolved) Issue records
│  └─ where issueType='damaged' & category='asset'
├─ maintenance: Number
│  └─ Currently 0 (reserved for future use)
└─ working: Number
│  └─ total - damaged - maintenance

INDEXES:
├─ { block: 1, room: 1 }
├─ { type: 1 }
└─ { block: 1, room: 1, type: 1 } → UNIQUE

RELATIONSHIPS:
└─ Referenced via Issue (assetType, block, room)
   No direct link, but aggregation matches on these fields

NOTES:
└─ CRITICAL: damaged/maintenance/working are NOT stored
   They are COMPUTED at read time via aggregation pipeline
└─ When issue resolves → removed from aggregation automatically
```

---

#### 5. **Issue**
```
Collection: issues
Description: Issue/complaint/problem reports

CATEGORIES: ['asset', 'infrastructure', 'academic', 'conduct', 'general']
PRIORITIES: ['low', 'normal', 'high']
STATUSES: ['open', 'in-progress', 'resolved']
ASSET_ISSUE_TYPES: ['damaged', 'maintenance']

CORE FIELDS (all issues):
├─ title: String (required, min 5 chars)
├─ description: String (required, min 10 chars)
├─ category: String (required)
│  └─ enum: CATEGORIES
├─ priority: String (default: 'normal')
│  └─ enum: PRIORITIES
├─ status: String (default: 'open')
│  └─ enum: STATUSES
├─ createdBy: ObjectId (ref: User, required)
│  └─ Issue creator (student, faculty, etc)
├─ proofImage: String (default: null)
│  └─ File path: uploads/issues/{filename}
├─ createdAt: Date (timestamp)
└─ updatedAt: Date (timestamp)

ASSET-SPECIFIC FIELDS (when category='asset'):
├─ assetType: String (required)
│  └─ example: 'Fan', 'Projector', 'AC'
├─ block: String (required)
│  └─ enum: ['Department', 'Algorithm']
├─ room: String (required, uppercase)
│  └─ example: 'A01'
├─ quantity: Number (required, min: 1)
│  └─ Number of affected units
├─ issueType: String (required)
│  └─ enum: ['damaged', 'maintenance']

ACADEMIC-SPECIFIC FIELDS (when category='academic'):
├─ subject: String (required)
├─ facultyName: String (optional)

RESOLUTION FIELDS:
├─ resolvedAt: Date (default: null)
│  └─ Set when status='resolved'
├─ assignedTo: ObjectId (ref: User, default: null)
│  └─ User handling the issue
├─ comments: [{
│  ├─ user: ObjectId (ref: User)
│  ├─ text: String
│  └─ createdAt: Date (default: now)
│  }]

RELATIONSHIPS:
├─ createdBy → User
├─ assignedTo → User (optional)
├─ comments[].user → User
└─ References Asset via (assetType, block, room)

STATUS LIFECYCLE (enforced):
├─ open → [in-progress, resolved]
├─ in-progress → [resolved]
├─ resolved → [] (terminal state)

VALIDATION:
└─ When category='asset':
   ├─ assetType required
   ├─ block required
   ├─ room required
   ├─ quantity required (>= 1)
   └─ issueType required
```

---

#### 6. **Project**
```
Collection: projects
Description: Coursework projects assigned to classrooms

FIELDS:
├─ projectTitle: String (required)
├─ subject: String (required)
├─ description: String (optional)
├─ facultyId: ObjectId (ref: User, required)
│  └─ Faculty who created the project
├─ classroomId: ObjectId (ref: Classroom, required)
├─ teamMembers: [{
│  ├─ rollNumber: String (required)
│  ├─ userId: ObjectId (ref: User)
│  }]
├─ deadline: Date (required)
├─ maxTeamSize: Number (default: 5)
├─ status: String (default: 'not_started')
│  └─ enum: ['not_started', 'in_progress', 'submitted', 'evaluated', 'overdue']
├─ updates: [{
│  ├─ userId: ObjectId (ref: User, required)
│  ├─ role: String (enum: ['student', 'faculty'])
│  ├─ message: String
│  └─ createdAt: Date (default: now)
│  }]
├─ createdAt: Date (timestamp)
└─ updatedAt: Date (timestamp)

RELATIONSHIPS:
├─ facultyId → User
├─ classroomId → Classroom
├─ teamMembers[].userId → User
├─ updates[].userId → User
└─ Referenced in Notification.projectId
```

---

#### 7. **Lab**
```
Collection: labs
Description: Computer labs and their specifications

FIELDS:
├─ labName: String (required)
├─ roomNumber: String (required, unique)
├─ numberOfSystems: Number (required, min: 1)
├─ accessories: [{
│  ├─ name: String (required)
│  └─ quantity: Number (default: 1)
│  }]
├─ incharge: ObjectId (ref: User, default: null)
│  └─ Lab administrator/in-charge
├─ department: String (required)
├─ createdAt: Date (timestamp)
└─ updatedAt: Date (timestamp)

RELATIONSHIPS:
└─ incharge → User (optional)
```

---

#### 8. **Utility**
```
Collection: utilities
Description: Classroom utilities and their status

FIELDS:
├─ utilityName: String (required)
├─ category: String (required)
│  └─ enum: ['furniture', 'equipment', 'facilities']
├─ location: String (required)
├─ quantity: Number (required, min: 0)
├─ description: String (optional)
├─ classroomId: ObjectId (ref: Classroom, default: null)
├─ status: String (default: 'working')
│  └─ enum: ['working', 'damaged', 'maintenance']
├─ createdAt: Date (timestamp)
└─ updatedAt: Date (timestamp)

RELATIONSHIPS:
└─ classroomId → Classroom (optional)
```

---

#### 9. **Timetable**
```
Collection: timetables
Description: Academic timetable images (one per classroom)

FIELDS:
├─ classroomId: ObjectId (ref: Classroom, required, unique)
│  └─ One timetable per classroom
├─ imageURL: String (required)
│  └─ CDN/storage URL
├─ fileName: String (required)
├─ fileSize: Number (required)
│  └─ In bytes
├─ uploadedBy: ObjectId (ref: User, required)
│  └─ Faculty/Admin who uploaded
├─ uploadedAt: Date (default: now)
├─ createdAt: Date (timestamp)
└─ updatedAt: Date (timestamp)

RELATIONSHIPS:
├─ classroomId → Classroom (one-to-one, unique)
└─ uploadedBy → User
```

---

#### 10. **Notification**
```
Collection: notifications
Description: User notifications (alerts and updates)

FIELDS:
├─ userId: ObjectId (ref: User, required)
├─ message: String (required)
├─ type: String (default: 'general')
│  └─ enum: ['deadline_update', 'project_status', 'project_update', 'general']
├─ projectId: ObjectId (ref: Project, optional)
├─ isRead: Boolean (default: false)
├─ createdAt: Date (timestamp)
└─ updatedAt: Date (timestamp)

RELATIONSHIPS:
├─ userId → User
└─ projectId → Project (optional)
```

---

## TASK 2 — RELATIONSHIPS

### Entity Relationship Map

```
User (1) ─── classroomId ──→ (M) Classroom
         └─── cr/lr ──→ Classroom
         └─── facultyList ──→ Classroom

Classroom (1) ─── room ──→ (1) Room
           └─── faculty ──→ (M) User
           └─── students ──→ (M) User

Issue ─── createdBy ──→ User
       ├── assignedTo ──→ User
       ├── comments[].user ──→ User
       └── references Asset via (assetType, block, room)

Asset ─── NO direct reference
      └── Linked to Issue via: type, block, room fields (implicit join)

Project ─── facultyId ──→ User
        ├── classroomId ──→ Classroom
        ├── teamMembers[].userId ──→ User
        └── updates[].userId ──→ User

Notification ─── userId ──→ User
             └── projectId ──→ Project

Timetable ─── classroomId ──→ Classroom (unique)
          └── uploadedBy ──→ User

Lab ─── incharge ──→ User

Utility ─── classroomId ──→ Classroom (optional)
```

### Key Relationship Table

| From | To | Cardinality | Key Field | Notes |
|------|----|----|-----------|-------|
| User | Classroom | Many-to-One | classroomId | Students assigned to one classroom |
| Classroom | Room | One-to-One | room | Each classroom in one room |
| Classroom | User (Faculty) | Many-to-Many | facultyList | Multiple faculty per classroom |
| Classroom | User (CR/LR) | One-to-One | cr, lr | Class and Lab reps |
| Issue | User (Creator) | Many-to-One | createdBy | Multiple issues per user |
| Issue | User (Assigned) | Many-to-One | assignedTo | Multiple issues per handler |
| Issue | Asset | Implicit (no FK) | assetType+block+room | Aggregation-based link |
| Project | Classroom | Many-to-One | classroomId | Multiple projects per classroom |
| Project | User (Faculty) | Many-to-One | facultyId | Multiple projects per faculty |
| Project | User (Students) | Many-to-Many | teamMembers[].userId | Team of students |
| Timetable | Classroom | One-to-One | classroomId | Unique per classroom |
| Notification | Project | Many-to-One | projectId | Optional, project-specific |

---

## TASK 3 — BUSINESS LOGIC

### Issue Lifecycle

#### **Issue Creation Flow**

```
POST /api/issues

1. VALIDATION PHASE
   ├─ title required (min 5 chars)
   ├─ description required (min 10 chars)
   ├─ category required (one of: asset, infrastructure, academic, conduct, general)
   ├─ Upload optional proof image
   │
2. CATEGORY-SPECIFIC VALIDATION
   │
   ├─ If category='asset':
   │  ├─ Require: assetType, block, room, quantity, issueType
   │  │
   │  └─ [ASSET SYNC] issueService.createIssueWithSync():
   │     ├─ Find Asset matching (type, block, room)
   │     │  └─ If NOT found → throw Error 404
   │     │
   │     ├─ [AGGREGATION QUERY]
   │     │  Query: Issue collection where:
   │     │  ├─ category='asset'
   │     │  ├─ issueType='damaged'
   │     │  ├─ status != 'resolved'
   │     │  ├─ assetType, block, room match
   │     │  └─ Group by (assetType, block, room) → $sum quantity
   │     │
   │     ├─ currentDamaged = sum from aggregation
   │     ├─ availableWorking = asset.total - currentDamaged
   │     │
   │     ├─ If quantity > availableWorking
   │     │  └─ throw Error 400
   │     │     "Cannot mark X {assetType}(s) as damaged.
   │     │      Only Y working unit(s) available
   │     │      (total: Z, damaged: A)"
   │     │
   │     └─ Validation passed → proceed
   │
   ├─ If category='academic':
   │  ├─ Require: subject
   │  ├─ Optional: facultyName
   │  └─ Proceed
   │
   └─ Otherwise: proceed with minimal validation
   
3. ISSUE CREATION
   └─ Create Issue document with:
      ├─ createdBy = userId
      ├─ status = 'open'
      ├─ priority = priority || 'normal'
      ├─ proofImage = file path or null
      └─ category-specific fields
   
4. RETURN
   └─ HTTP 201 with populated Issue
```

#### **Issue Status Transition Flow**

```
PUT/PATCH /api/issues/:id/status

1. RETRIEVE ISSUE
   └─ Find Issue by ID

2. STATUS TRANSITION LOGIC
   
   If status provided:
   ├─ Current Issue status → Check allowed transitions:
   │  ├─ If current='open' → allowed: [in-progress, resolved]
   │  ├─ If current='in-progress' → allowed: [resolved]
   │  ├─ If current='resolved' → allowed: [] (terminal)
   │  │
   │  ├─ If new status not in allowed → Error 400
   │  │  "Cannot transition from 'X' to 'Y'. 
   │  │   Allowed transitions: [...]"
   │  │
   │  ├─ If valid transition:
   │  │  ├─ Update issue.status = newStatus
   │  │  ├─ If status='resolved':
   │  │  │  ├─ Set resolvedAt = now()
   │  │  │  └─ [AUTOMATIC AGGREGATION UPDATE]
   │  │  │     Issue now removed from future aggregations
   │  │  │     → Asset.damaged count decreases
   │  │  │     → No manual decrement needed
   │  │  └─ Save Issue
   │  │
   │  └─ Return updated Issue

3. OPTIONAL UPDATES
   ├─ If priority provided: update issue.priority
   ├─ If assignedTo provided: update issue.assignedTo (can be null)
   └─ Save Issue

4. RETURN
   └─ HTTP 200 with updated Issue
```

### Asset Inventory System

#### **CRITICAL: Computed vs Stored Fields**

```
In Asset collection:
┌─────────────────────────────────────┐
│ STORED in Database:                 │
├─────────────────────────────────────┤
│ type      : String                  │
│ block     : String                  │
│ room      : String                  │
│ total     : Number ✓ STORED          │
│ damaged   : NOT HERE                 │
│ working   : NOT HERE                 │
│ maintenance: NOT HERE                │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ COMPUTED at Read Time via MongoDB   │
│ Aggregation Pipeline:               │
├─────────────────────────────────────┤
│ damaged = $sum(Issue.quantity)      │
│           where:                    │
│           - category='asset'        │
│           - issueType='damaged'     │
│           - status != 'resolved'    │
│           - same type,block,room    │
│                                     │
│ working = total - damaged           │
│ maintenance = 0 (reserved)          │
└─────────────────────────────────────┘
```

#### **Asset Aggregation Pipeline**

```javascript
Pipeline to get damaged counts:

1. $match stage:
   {
     category: 'asset',
     issueType: 'damaged',
     status: { $ne: 'resolved' }
   }

2. $addFields stage (normalization):
   {
     _normAssetType: { $toUpper: { $trim: '$assetType' } },
     _normBlock: { $toUpper: { $trim: '$block' } },
     _normRoom: { $toUpper: { $trim: '$room' } }
   }

3. $group stage:
   {
     _id: {
       assetType: '$_normAssetType',
       block: '$_normBlock',
       room: '$_normRoom'
     },
     damaged: { $sum: '$quantity' }
   }

Result: Map<"TYPE|BLOCK|ROOM", { damaged: N }>
```

#### **Example Asset Calculation**

```
Asset Record:
{
  _id: "507f1f77bcf86cd799439011",
  type: "Fan",
  block: "Department",
  room: "A01",
  total: 10
}

Active Issues for this Asset:
Issue 1: { quantity: 3, issueType: 'damaged', status: 'open' }
Issue 2: { quantity: 2, issueType: 'damaged', status: 'in-progress' }

Aggregation Result:
{
  damaged: 3 + 2 = 5
}

Computed Fields:
{
  damaged: 5,
  maintenance: 0,
  working: 10 - 5 = 5
}

Response includes:
{
  type: "Fan",
  block: "Department",
  room: "A01",
  total: 10,
  damaged: 5,        ← computed
  maintenance: 0,    ← computed
  working: 5         ← computed
}
```

#### **Asset Creation Flow**

```
POST /api/assets

1. VALIDATION
   ├─ type: required, must be in enum
   ├─ block: required (Department/Algorithm)
   ├─ room: required, will be uppercased
   ├─ total: required, >= 1
   └─ Check no duplicate (type, block, room)

2. CREATE ASSET
   └─ Asset.create({ type, block, room: room.toUpperCase(), total })

3. ENRICH WITH COMPUTED COUNTS
   ├─ Call aggregateAssetCounts() for this asset
   ├─ damaged = 0 (no issues yet)
   ├─ Add computed fields
   └─ Return enriched asset

4. HTTP 201 with:
   {
     _id, type, block, room, total,
     damaged: 0, maintenance: 0, working: total
   }
```

#### **Asset Update Flow**

```
PUT /api/assets/:id

1. FIND ASSET
   └─ Asset.findById(id)

2. UPDATE FIELDS
   ├─ If type provided: update
   ├─ If block provided: update
   ├─ If room provided: update (uppercase)
   ├─ If total provided:
   │  ├─ Get current aggregated damaged count
   │  ├─ Validate: newTotal >= damaged
   │  │  └─ Error 400 if validation fails
   │  └─ Update total
   └─ Save Asset

3. RECALCULATE COUNTS
   ├─ Call aggregateAssetCounts() for updated asset
   ├─ Enrich with computed counts
   └─ Return enriched asset

4. HTTP 200
```

#### **Asset Retrieval with Enrichment**

```
GET /api/assets [?block=X&room=Y&type=Z]

1. QUERY ASSETS
   └─ Asset.find({ block?: X, room?: Y, type?: Z })
      .lean()  // for performance

2. AGGREGATION
   └─ aggregateAssetCounts({ block, room, type })
      └─ Returns Map<"TYPE|BLOCK|ROOM", { damaged: N }>

3. ENRICHMENT
   └─ For each asset:
      ├─ Look up in map by "type|block|room" key
      ├─ Get damaged count (or 0 if not in map)
      ├─ Calculate working = total - damaged
      └─ Add virtual fields to object

4. RETURN HTTP 200
   [
     {
       _id, type, block, room, total,
       damaged: X,
       maintenance: 0,
       working: Y
     },
     ...
   ]
```

### Validation & Business Rules

```
Issue Creation Constraints:
├─ Asset issues:
│  ├─ assetType must match existing Asset
│  ├─ block must match existing Asset  
│  ├─ room must match existing Asset
│  ├─ quantity must not exceed (asset.total - currentDamaged)
│  ├─ quantity >= 1
│  └─ issueType in [damaged, maintenance]
│
├─ Academic issues:
│  └─ subject required
│
└─ All issues:
   ├─ title >= 5 characters
   ├─ description >= 10 characters
   └─ category in enum

Asset Constraints:
├─ type must be in predefined enum
├─ block in [Department, Algorithm]
├─ (type, block, room) must be unique
├─ total >= 1
└─ When updating total: newTotal >= currentDamaged

Status Transition Rules:
├─ Enforced state machine:
│  ├─ open → in-progress (allowed)
│  ├─ open → resolved (allowed)
│  ├─ in-progress → resolved (allowed)
│  └─ resolved → any (NOT allowed - terminal)
│
└─ Resolution:
   ├─ When status='resolved': set resolvedAt = now()
   └─ Issue removed from future aggregations
```

---

## TASK 4 — API FLOW

### Issue Management Endpoints

#### **POST /api/issues - Create Issue**
```
Authentication: Required (student, faculty, admin, hod)
Content-Type: multipart/form-data (if uploading proof)

REQUEST BODY:
├─ title: String (required, min 5 chars)
├─ description: String (required, min 10 chars)
├─ category: String (required)
│  └─ enum: ['asset', 'infrastructure', 'academic', 'conduct', 'general']
├─ priority: String (optional, default: 'normal')
│  └─ enum: ['low', 'normal', 'high']
│
├─ [If category='asset'] REQUIRED:
│ ├─ assetType: String
│ ├─ block: String (Department/Algorithm)
│ ├─ room: String (e.g., A01)
│ ├─ quantity: Number (>= 1)
│ └─ issueType: String (damaged/maintenance)
│
├─ [If category='academic'] REQUIRED:
│ ├─ subject: String
│ └─ facultyName: String (optional)
│
└─ proofImage: File (optional, multipart)

PROCESSING:
├─ If asset category:
│  └─ Call issueService.createIssueWithSync()
│     ├─ Validate asset exists
│     ├─ Check working units available
│     └─ Create issue if validation passes
│
└─ Otherwise: create issue directly

RESPONSE 201 Created:
{
  success: true,
  message: "Issue created successfully",
  data: {
    _id: ObjectId,
    title, description, category, priority, status,
    createdBy: { _id, name, email, role },
    assignedTo: null,
    createdAt, updatedAt,
    ...
  }
}

RESPONSE 400 Bad Request:
{
  success: false,
  message: "Validation failed / Asset not found / Not enough working units"
}

RESPONSE 404 Not Found:
{
  success: false,
  message: "Asset not found: X in Y block, room Z"
}
```

#### **GET /api/issues/my - Get My Issues**
```
Authentication: Required

Query Parameters (optional):
├─ status: String (filter)
├─ priority: String (filter)
└─ category: String (filter)

ROLE-BASED BEHAVIOR:
├─ Student: sees only issues createdBy=userId
├─ Faculty/Admin/HOD: sees all issues (no filtering by creator)

RESPONSE 200:
{
  success: true,
  count: N,
  data: [
    {
      _id, title, category, priority, status,
      createdBy: { _id, name, email, role },
      assignedTo: { _id, name, email },
      createdAt
    },
    ...
  ]
}
Sorted: createdAt descending (newest first)
```

#### **GET /api/issues - Get All Issues**
```
Authentication: Required (admin, hod only)

Query Parameters (optional):
├─ status: String
├─ priority: String
└─ category: String

RESPONSE 200:
{
  success: true,
  count: N,
  data: [{ issues }]
}
Sorted: createdAt descending
```

#### **GET /api/issues/:id - Get Issue by ID**
```
Authentication: Required

Path Parameters:
└─ id: ObjectId

RESPONSE 200:
{
  success: true,
  data: {
    _id, title, description, category, priority, status,
    createdBy: { _id, name, email, role },
    assignedTo: { _id, name, email },
    comments: [
      {
        user: { _id, name, email, role },
        text: String,
        createdAt
      },
      ...
    ],
    proofImage: String,
    resolvedAt: Date,
    createdAt, updatedAt
  }
}

RESPONSE 404:
{
  success: false,
  message: "Issue not found"
}
```

#### **PUT/PATCH /api/issues/:id/status - Update Issue Status**
```
Authentication: Required (faculty, admin, hod)

Path Parameters:
└─ id: ObjectId

REQUEST BODY (at least one required):
├─ status: String (open/in-progress/resolved)
├─ priority: String (low/normal/high)
└─ assignedTo: ObjectId or null

PROCESSING:
├─ If status provided:
│  ├─ Validate transition from current status
│  ├─ If resolved: set resolvedAt = now()
│  └─ Issue removed from asset aggregation
│
└─ Save and return updated issue

RESPONSE 200:
{
  success: true,
  message: "Issue updated successfully",
  data: { updated issue object }
}

RESPONSE 400:
{
  success: false,
  message: "Cannot transition from 'X' to 'Y'"
}
```

#### **POST /api/issues/:id/comments - Add Comment**
```
Authentication: Required (any)

REQUEST BODY:
└─ text: String (required)
   OR
   comment: String (required)

RESPONSE 200:
{
  success: true,
  message: "Comment added successfully",
  data: { updated issue with new comment in array }
}
```

---

### Asset Management Endpoints

#### **POST /api/assets - Create Asset**
```
Authentication: Required (admin only)

REQUEST BODY:
├─ type: String (required, must be in enum)
├─ block: String (required, Department/Algorithm)
├─ room: String (required, e.g., A01)
└─ total: Number (required, >= 1)

VALIDATION:
└─ No duplicate (type, block, room)

RESPONSE 201:
{
  success: true,
  message: "Asset created successfully",
  data: {
    _id, type, block, room, total,
    damaged: 0,
    maintenance: 0,
    working: total,
    createdAt, updatedAt
  }
}

RESPONSE 409:
{
  success: false,
  message: "Asset 'X' already exists in Y block, room Z"
}
```

#### **GET /api/assets - Get All Assets**
```
Authentication: Required (admin, hod)

Query Parameters (optional, all cumulative):
├─ block: String
├─ room: String
└─ type: String

RESPONSE 200:
{
  success: true,
  count: N,
  data: [
    {
      _id, type, block, room, total,
      damaged: X,        ← computed from aggregation
      maintenance: 0,    ← computed
      working: Y         ← computed
    },
    ...
  ]
}
Sorted: block, room, type (ascending)
```

#### **GET /api/assets/:id - Get Asset by ID**
```
Authentication: Required (any)

RESPONSE 200:
{
  success: true,
  data: { asset with computed counts }
}
```

#### **PUT /api/assets/:id - Update Asset**
```
Authentication: Required (admin only)

REQUEST BODY (all optional):
├─ type: String
├─ block: String
├─ room: String
└─ total: Number

VALIDATION:
├─ If updating total:
│  └─ newTotal >= currentDamaged
│  └─ If validation fails: Error 400

RESPONSE 200:
{
  success: true,
  message: "Asset updated successfully",
  data: { updated asset with recomputed counts }
}
```

#### **DELETE /api/assets/:id - Delete Asset**
```
Authentication: Required (admin only)

RESPONSE 200:
{
  success: true,
  message: "Asset deleted successfully"
}
```

---

### User & Authentication Endpoints

#### **POST /api/auth/login - Login**
```
Authentication: None (public)

REQUEST BODY:
├─ email: String (required)
└─ password: String (required)

RESPONSE 200:
{
  success: true,
  message: "Login successful",
  token: "JWT_TOKEN_STRING",
  user: {
    _id, name, email, role,
    registrationNumber, teacherId, classroomId,
    isFirstLogin
  }
}

RESPONSE 401:
{
  success: false,
  message: "Invalid email or password" OR "User account is inactive"
}
```

#### **POST /api/auth/register - Create User (Admin)**
```
Authentication: Required (admin only)

REQUEST BODY:
├─ name: String (required)
├─ email: String (required, unique)
├─ password: String (required)
├─ role: String (required, NOT 'hod')
│  └─ enum: ['student', 'faculty', 'admin']
│
├─ [If role='student']:
│ ├─ registrationNumber: String (required, unique)
│ ├─ classroomId: ObjectId (required)
│ ├─ courseType: String (default: BTech)
│ └─ specialization: String (required if courseType='MTech')
│
└─ [If role='faculty' or 'admin']:
  └─ teacherId: String (required, unique)

RESPONSE 201:
{
  success: true,
  message: "User created successfully",
  data: { user object with _id, name, email, role, etc. }
}

RESPONSE 400/409:
{
  success: false,
  message: "Validation/duplicate error"
}
```

---

### Classroom Management Endpoints

#### **POST /api/classrooms - Create Classroom**
```
Authentication: Required (admin only)

REQUEST BODY:
├─ course: String (required, BTech/MTech)
├─ specialization: String (required)
├─ year: Number (required, 1-4 for BTech, 1-2 for MTech)
├─ section: String (required)
├─ block: String (required, Main Block/Algorithm Block)
├─ room: ObjectId (required)
├─ department: String (required)
├─ cr: ObjectId (optional)
└─ lr: ObjectId (optional)

UNIQUE CONSTRAINT:
└─ (course, specialization, year, section) must be unique

RESPONSE 201: Classroom created
RESPONSE 409: Duplicate classroom
```

#### **GET /api/classrooms - Get All Classrooms**
```
Authentication: Required (admin, hod)

RESPONSE 200:
{
  success: true,
  count: N,
  data: [{ classrooms with populated references }]
}
```

#### **GET /api/classrooms/my - My Classrooms (Faculty)**
```
Authentication: Required

RESPONSE 200:
{
  success: true,
  data: [{ classrooms where user is in facultyList }]
}
```

---

### Statistics Endpoints

#### **GET /api/stats/admin - Admin Dashboard Stats**
```
Authentication: Required (admin, hod)

RESPONSE 200:
{
  success: true,
  data: {
    totalClassrooms: N,
    totalUsers: N,
    totalIssues: N,
    openIssues: N,
    inProgressIssues: N,
    resolvedIssues: N,
    totalUtilities: N,
    totalAssets: N,
    totalLabs: N,
    totalProjects: N,
    
    issuesByClassroom: [
      { _id, count, department, year, section }
    ],
    issuesByPriority: [
      { _id: 'low', count: X }
    ],
    recentIssues: [
      { title, status, priority, category, createdAt }
    ]
  }
}
```

#### **GET /api/stats/faculty - Faculty Dashboard Stats**
```
Authentication: Required (faculty only)

RESPONSE 200:
{
  success: true,
  data: {
    totalProjects: N,
    totalClassrooms: N,
    totalIssues: N,
    openIssues: N,
    resolvedIssues: N
  }
}
```

#### **GET /api/stats/student - Student Dashboard Stats**
```
Authentication: Required (student only)

RESPONSE 200:
{
  success: true,
  data: {
    totalIssues: N,
    openIssues: N,
    inProgressIssues: N,
    resolvedIssues: N
  }
}
```

---

## Summary Tables

### Key Enums & Constants

| Category | Values |
|----------|--------|
| **User Roles** | admin, faculty, student, hod |
| **Issue Categories** | asset, infrastructure, academic, conduct, general |
| **Issue Priorities** | low, normal, high |
| **Issue Status** | open, in-progress, resolved |
| **Asset Issue Types** | damaged, maintenance |
| **Course Types** | BTech, MTech |
| **Blocks** | Main Block, Algorithm Block (Classroom) / Department, Algorithm (Asset/Issue) |
| **Notification Types** | deadline_update, project_status, project_update, general |
| **Project Status** | not_started, in_progress, submitted, evaluated, overdue |
| **Utility Status** | working, damaged, maintenance |

### Access Control Matrix

| Resource | Admin | HOD | Faculty | Student |
|----------|-------|-----|---------|---------|
| Create Issue | ✓ | ✓ | ✓ | ✓ |
| View All Issues | ✓ | ✓ | ✗ | ✗ |
| View My Issues | ✓ | ✓ | ✓ (all) | ✓ (own) |
| Update Issue Status | ✓ | ✓ | ✓ | ✗ |
| Create Asset | ✓ | ✗ | ✗ | ✗ |
| View Assets | ✓ | ✓ | ✗ | ✗ |
| Update Asset | ✓ | ✗ | ✗ | ✗ |
| Create Classroom | ✓ | ✗ | ✗ | ✗ |
| View All Classrooms | ✓ | ✓ | ✗ | ✗ |
| Create Project | ✗ | ✗ | ✓ | ✗ |
| Manage Users | ✓ | ✗ | ✗ | ✗ |

---

