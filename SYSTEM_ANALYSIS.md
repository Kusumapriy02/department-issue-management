# Full-Stack Project System Analysis

**Project Type**: Campus Facility Management System  
**Stack**: Node.js + Express + MongoDB + React  
**Database**: MongoDB (10 collections)

---

## TASK 1: IDENTIFY ENTITIES

### Collection: USER
**Purpose**: Authentication and user management  
**Fields**:
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | String | Yes | Min 2 chars, trimmed |
| email | String | Yes | Unique, lowercase, valid email format |
| registrationNumber | String | No | Unique (sparse) - for students only |
| teacherId | String | No | Unique (sparse) - for faculty/HOD only |
| passwordHash | String | Yes | Min 6 chars, auto-hashed before save |
| role | Enum | Yes | Values: 'admin', 'faculty', 'student', 'hod' |
| classroomId | ObjectId (Classroom) | No | Links student to classroom |
| isActive | Boolean | No | Default: true |
| isFirstLogin | Boolean | No | Default: true (password change on first login) |
| courseType | Enum | No | Values: 'BTech', 'MTech' |
| specialization | Enum | No | Values: null, 'AIML', 'CST', 'CNIS' |
| createdAt | Date | Auto | Timestamp |
| updatedAt | Date | Auto | Timestamp |

**Indexes**:
- Unique: email
- Unique: registrationNumber (sparse)
- Unique: teacherId (sparse)

---

### Collection: CLASSROOM
**Purpose**: Academic classroom groupings (academic structure mapping)  
**Fields**:
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| course | Enum | Yes | 'BTech' or 'MTech' |
| specialization | String | Yes | e.g., 'CSE', 'ECE', 'ME' (uppercase) |
| year | Number | Yes | 1-4 for BTech, 1-2 for MTech |
| section | String | Yes | e.g., 'A', 'B', 'C' (uppercase) |
| block | Enum | Yes | 'Main Block' or 'Algorithm Block' |
| room | ObjectId (Room) | Yes | Physical room assignment |
| department | String | Yes | Department name |
| programDuration | Number | No | Default: 4 (years) |
| cr | ObjectId (User) | No | Class Representative |
| lr | ObjectId (User) | No | Lab Representative |
| facultyList | [ObjectId (User)] | No | Assigned faculty members |
| createdAt | Date | Auto | Timestamp |
| updatedAt | Date | Auto | Timestamp |

**Indexes**:
- Unique compound: (course, specialization, year, section)

**Relationship**:
- 1 Classroom → 1 Room (physical location)
- 1 Classroom → Many Users (students via classroomId)
- 1 Classroom → Many Faculty (via facultyList)
- 1 Classroom → 1 CR User (optional)
- 1 Classroom → 1 LR User (optional)

---

### Collection: ROOM
**Purpose**: Physical classroom locations  
**Fields**:
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| number | String | Yes | Unique room identifier, e.g., "A01" |
| block | Enum | Yes | 'Main Block' or 'Algorithm Block' |
| assignedTo | ObjectId (Classroom) | No | Which classroom uses this room (null = available) |
| capacity | Number | No | Default: 60 (student capacity) |
| description | String | No | Room notes/details |
| amenities | [String] | No | Enum: 'Projector', 'AC', 'Whiteboard', 'Smart Board', 'Lab Equipment' |
| isActive | Boolean | No | Default: true (availability) |
| createdAt | Date | Auto | Timestamp |
| updatedAt | Date | Auto | Timestamp |

**Indexes**:
- Unique: number
- Compound: (block, assignedTo, isActive)

---

### Collection: ASSET
**Purpose**: Facility assets inventory (classroom/lab equipment)  
**Fields**:
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| type | Enum | Yes | 'Bench', 'Fan', 'LED Board', 'Projector', 'AC', 'Whiteboard', 'Smart Board', 'Computer', 'Chair', 'Desk', 'Speaker', 'CCTV', 'Router', 'Printer', 'UPS', 'Other' |
| block | Enum | Yes | 'Department' or 'Algorithm' |
| room | String | Yes | Room identifier (uppercase), e.g., "A01" |
| total | Number | Yes | Total quantity in this room |
| createdAt | Date | Auto | Timestamp |
| updatedAt | Date | Auto | Timestamp |

**Computed Fields** (calculated from Issue aggregation, NOT stored):
- `damaged`: Sum of quantities from active (unresolved) "asset" category issues with issueType='damaged'
- `maintenance`: 0 (placeholder for future use)
- `working`: total - damaged

**Indexes**:
- Unique compound: (block, room, type)
- Compound: (block, room)
- Simple: type

**NOTE**: `damaged` and `maintenance` are NOT stored in Asset. They are computed via MongoDB aggregation on read.

---

### Collection: ISSUE
**Purpose**: Problem/damage reporting and tracking  
**Fields**:

#### Core Fields (All Categories)
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| title | String | Yes | Min 5 chars, trimmed |
| description | String | Yes | Min 10 chars |
| category | Enum | Yes | 'asset', 'infrastructure', 'academic', 'conduct', 'general' |
| priority | Enum | No | 'low', 'normal', 'high' (default: 'normal') |
| status | Enum | No | 'open', 'in-progress', 'resolved' (default: 'open') |
| createdBy | ObjectId (User) | Yes | Issue reporter |
| proofImage | String | No | File path to uploaded proof image |
| createdAt | Date | Auto | Timestamp |
| updatedAt | Date | Auto | Timestamp |

#### Asset-Specific Fields (Only when category='asset')
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| assetType | String | Conditional | e.g., 'Fan', 'Projector' (required if category='asset') |
| block | Enum | Conditional | 'Department' or 'Algorithm' (required if category='asset') |
| room | String | Conditional | Room identifier, uppercase (required if category='asset') |
| quantity | Number | Conditional | Min 1 (required if category='asset') |
| issueType | Enum | Conditional | 'damaged' or 'maintenance' (required if category='asset') |

#### Academic-Specific Fields (Only when category='academic')
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| subject | String | Conditional | Required if category='academic' |
| facultyName | String | No | Optional |

#### Resolution Fields
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| resolvedAt | Date | No | Set when status='resolved' |
| assignedTo | ObjectId (User) | No | Staff member assigned to resolve |
| comments | Array | No | Comment thread |

**Comments Sub-Document**:
```javascript
{
  user: ObjectId (User),
  text: String,
  createdAt: Date (default: now)
}
```

**Validation Rules**:
- If category='asset': assetType, block, room, quantity, issueType are REQUIRED
- If category='academic': subject is REQUIRED
- Quantity must be ≤ available working units for that asset
- Status transitions: open → in-progress → resolved (no backwards)

---

### Collection: UTILITY
**Purpose**: Classroom supplies/equipment tracking  
**Fields**:
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| utilityName | String | Yes | Name of utility item |
| category | Enum | Yes | 'furniture', 'equipment', 'facilities' |
| location | String | Yes | e.g., "Room A01" |
| quantity | Number | Yes | Min 0 |
| description | String | No | Item notes |
| classroomId | ObjectId (Classroom) | No | Associated classroom (null = shared) |
| status | Enum | No | 'working', 'damaged', 'maintenance' (default: 'working') |
| createdAt | Date | Auto | Timestamp |
| updatedAt | Date | Auto | Timestamp |

---

### Collection: LAB
**Purpose**: Laboratory facility management  
**Fields**:
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| labName | String | Yes | Lab identifier |
| roomNumber | String | Yes | Unique room assignment |
| numberOfSystems | Number | Yes | Computer systems count |
| accessories | Array | No | Sub-documents (name, quantity) |
| incharge | ObjectId (User) | No | Lab staff member responsible |
| department | String | Yes | Department owning the lab |
| createdAt | Date | Auto | Timestamp |
| updatedAt | Date | Auto | Timestamp |

**Accessories Sub-Document**:
```javascript
{
  name: String,
  quantity: Number (default: 1)
}
```

---

### Collection: PROJECT
**Purpose**: Academic project/assignment management  
**Fields**:
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| projectTitle | String | Yes | Project name |
| subject | String | Yes | Course subject |
| description | String | No | Project details |
| facultyId | ObjectId (User) | Yes | Project creator (faculty) |
| classroomId | ObjectId (Classroom) | Yes | Classroom assignment |
| teamMembers | Array | No | Sub-documents (rollNumber, userId) |
| deadline | Date | Yes | Submission deadline |
| maxTeamSize | Number | No | Default: 5 |
| status | Enum | No | 'not_started', 'in_progress', 'submitted', 'evaluated', 'overdue' (default: 'not_started') |
| updates | Array | No | Project update thread |
| createdAt | Date | Auto | Timestamp |
| updatedAt | Date | Auto | Timestamp |

**TeamMembers Sub-Document**:
```javascript
{
  rollNumber: String,
  userId: ObjectId (User)
}
```

**Updates Sub-Document**:
```javascript
{
  userId: ObjectId (User),
  role: Enum ('student', 'faculty'),
  message: String,
  createdAt: Date (default: now)
}
```

**Relationship**:
- 1 Project → 1 Faculty (creator)
- 1 Project → 1 Classroom
- 1 Project → Many Students (team members)

---

### Collection: NOTIFICATION
**Purpose**: User notifications and alerts  
**Fields**:
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| userId | ObjectId (User) | Yes | Recipient user |
| message | String | Yes | Notification content |
| type | Enum | No | 'deadline_update', 'project_status', 'project_update', 'general' (default: 'general') |
| projectId | ObjectId (Project) | No | Associated project (if applicable) |
| isRead | Boolean | No | Default: false |
| createdAt | Date | Auto | Timestamp |
| updatedAt | Date | Auto | Timestamp |

---

### Collection: TIMETABLE
**Purpose**: Class schedule/timetable images  
**Fields**:
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| classroomId | ObjectId (Classroom) | Yes | Unique per classroom |
| imageURL | String | Yes | File path to timetable image |
| fileName | String | Yes | Original filename |
| fileSize | Number | Yes | File size in bytes |
| uploadedBy | ObjectId (User) | Yes | Who uploaded |
| uploadedAt | Date | No | Default: now |
| createdAt | Date | Auto | Timestamp |
| updatedAt | Date | Auto | Timestamp |

**Indexes**:
- Unique: classroomId (one timetable per classroom)

---

## TASK 2: RELATIONSHIPS

### Entity Relationship Diagram (Text)

```
USER
 ├─→ CLASSROOM (via classroomId) [Many students per classroom]
 ├─→ Issue (via createdBy) [User creates issues]
 ├─→ Issue (via assignedTo) [Staff member resolves]
 ├─→ Project (via facultyId) [Faculty creates projects]
 ├─→ Classroom (via cr) [Class representative]
 ├─→ Classroom (via lr) [Lab representative]
 ├─→ Classroom (via facultyList[]) [Faculty teaching]
 ├─→ Notification (via userId) [Receives notifications]
 ├─→ Timetable (via uploadedBy) [Uploads timetable]
 └─→ Lab (via incharge) [Lab responsible]

CLASSROOM
 ├─→ ROOM (via room) [Assigned to one room]
 ├─→ USER[] (via direct reference - students with classroomId)
 ├─→ USER[] (via cr, lr, facultyList[]) [Representatives & faculty]
 ├─→ ISSUE[] [Implicitly via assetType/block/room]
 ├─→ PROJECT[] (via classroomId) [Projects assigned to class]
 ├─→ UTILITY[] (via classroomId) [Utilities in classroom]
 └─→ TIMETABLE (via classroomId) [1:1 timetable per classroom]

ROOM
 └─→ CLASSROOM (via assignedTo) [Which class uses this room]

ASSET
 ├─→ ISSUE[] [Implicitly - issues track damage]
 └─→ Computed from ISSUE aggregation [damaged, working counts]

ISSUE
 ├─→ USER (via createdBy) [Reporter]
 ├─→ USER (via assignedTo) [Handler]
 ├─→ ASSET [Implicitly: assetType + block + room matches Asset]
 └─→ USER[] (via comments[].user) [Comment thread participants]

PROJECT
 ├─→ USER (via facultyId) [Creator]
 ├─→ CLASSROOM (via classroomId) [Assigned classroom]
 ├─→ USER[] (via teamMembers[].userId) [Team students]
 └─→ USER[] (via updates[].userId) [Update authors]

UTILITY
 ├─→ CLASSROOM (via classroomId) [Optional - shared if null]

LAB
 ├─→ USER (via incharge) [Responsible staff]

NOTIFICATION
 └─→ USER (via userId) [Recipient]
 └─→ PROJECT (via projectId) [Optional - associated project]

TIMETABLE
 ├─→ CLASSROOM (via classroomId) [Which class]
 └─→ USER (via uploadedBy) [Who uploaded]
```

### Key Relationships Detailed

#### 1. User → Issue (Reporting & Resolution)
- **Creates**: `Issue.createdBy = User._id` (Many-to-1)
- **Resolves**: `Issue.assignedTo = User._id` (Many-to-1)
- **Comments**: `Issue.comments[].user = User._id` (Many-to-Many via array)

#### 2. Issue → Asset (Implicit Join)
- **No Direct ObjectId**: Join is via composite key: `(assetType, block, room)`
- **Validation**: When creating asset issue, asset must exist with matching (type, block, room)
- **Aggregation**: `Asset.damaged` computed by:
  ```
  SUM(Issue.quantity) 
  WHERE Issue.category='asset' 
    AND Issue.issueType='damaged' 
    AND Issue.status!='resolved'
    AND (Issue.assetType, Issue.block, Issue.room) matches Asset
  ```

#### 3. Issue → Classroom (Implicit via Academic Issues)
- **Via**: category='academic' issues may reference subject taught in classrooms
- **No Direct FK**: Only referenced implicitly through subject field

#### 4. User → Classroom (Students & Staff)
- **Students**: `Classroom.users` implicit via `User.classroomId = Classroom._id` (Many-to-1)
- **Class Rep**: `Classroom.cr = User._id` (Optional)
- **Lab Rep**: `Classroom.lr = User._id` (Optional)
- **Faculty**: `Classroom.facultyList = [User._id, ...]` (Many-to-Many)

#### 5. Project → User/Classroom (Academic Projects)
- **Creator**: `Project.facultyId = User._id` (1-to-1)
- **Class**: `Project.classroomId = Classroom._id` (Many-to-1)
- **Team**: `Project.teamMembers[].userId = User._id` (Many-to-Many via array)

#### 6. Notification → User/Project
- **To User**: `Notification.userId = User._id` (Many-to-1)
- **About Project**: `Notification.projectId = Project._id` (Optional Many-to-1)

#### 7. Timetable → Classroom (1:1)
- **Unique**: `Timetable.classroomId = Classroom._id` (One-to-1 unique)

---

## TASK 3: BUSINESS LOGIC

### Issue Creation Workflow

#### Step 1: User Initiates Issue Report
```
POST /api/issues
Body: {
  title,
  description,
  category,
  priority: 'normal' | 'low' | 'high',
  proofImage: (optional file),
  // Category-specific fields...
}
```

#### Step 2: Category-Specific Validation

**If category = 'asset'**:
1. Validate required fields: assetType, block, room, quantity, issueType
2. **Asset Lookup**: Query `Asset.findOne({ type, block, room })`
   - If not found → Error 404: "Asset not found"
3. **Availability Check**: 
   - Aggregate current damage from `Issue.find({ category:'asset', status!='resolved' })` for this asset
   - Calculate: `remaining = asset.total - currentDamaged`
   - If `quantity > remaining` → Error 400: "Cannot mark X items. Only Y working units available"
4. Create issue with asset fields

**If category = 'academic'**:
1. Validate required field: subject
2. Create issue with academic fields

**Other categories** ('infrastructure', 'conduct', 'general'):
- Minimal validation
- Create issue

#### Step 3: Issue Persistence
```javascript
Issue.create({
  title,
  description,
  category,
  priority,
  status: 'open',        // Always starts as open
  createdBy: userId,
  proofImage,
  [assetType, block, room, quantity, issueType]  // If asset
  [subject, facultyName]  // If academic
})
```

**NO ASSET MODIFICATION**: Asset.total is NOT decremented. Only Issue records the damage claim.

---

### Asset Analytics & Computed Fields Workflow

#### Query: GET /api/assets
```javascript
1. Fetch: Asset.find({ ...filters })
2. For each asset, aggregate damage counts via MongoDB pipeline:

   PIPELINE:
   $match: {
     category: 'asset',
     issueType: 'damaged',
     status: { $ne: 'resolved' }  // Only ACTIVE issues
   }
   $group: {
     _id: { assetType, block, room },
     damaged: { $sum: quantity }
   }

3. Build countsMap: Map<"TYPE|BLOCK|ROOM" → { damaged: N }>

4. Enrich each Asset:
   countsMap.get(key) → { damaged }
   asset.damaged = damaged
   asset.working = asset.total - damaged
   asset.maintenance = 0
```

#### Key Rule: Active vs Resolved
- **Active Issues**: status ∈ ['open', 'in-progress'] → COUNT toward damage
- **Resolved Issues**: status = 'resolved' → EXCLUDED from count
- **Result**: When issue resolved, its quantity automatically removed from damaged count

#### Example:
```
Asset: Fan in Department block, Room A01
  total: 10

Issue #1: Create (5 fans damaged, status='open') → aggregation returns damaged=5, working=5
Issue #2: Create (3 fans damaged, status='open') → aggregation returns damaged=8, working=2
Issue #1: Resolve (status='resolved') → aggregation returns damaged=3 (only Issue #2), working=7
```

---

### Issue Resolution Workflow

#### Step 1: Update Issue Status
```
PUT /api/issues/:id/status
Body: {
  status: 'open' | 'in-progress' | 'resolved',
  priority: (optional),
  assignedTo: userId | null (optional)
}
```

#### Step 2: Status Lifecycle Validation
```javascript
ALLOWED TRANSITIONS:
  'open' → ['in-progress', 'resolved']
  'in-progress' → ['resolved']
  'resolved' → [] (terminal - no transitions allowed)

BACKWARDS transitions: NOT ALLOWED
  'resolved' → 'open': Error 400
  'in-progress' → 'open': Error 400
```

#### Step 3: Persistence & Side Effects
```javascript
IF status === 'resolved':
  issue.status = 'resolved'
  issue.resolvedAt = new Date()
  
IF assignedTo provided:
  issue.assignedTo = userId | null

Save issue to database
```

#### Step 4: Asset Impact (Automatic via Aggregation)
- **No direct code**: Asset.damaged NOT manually decremented
- **Automatic**: Next GET /api/assets query re-aggregates from Issue collection
- **Result**: resolved issues automatically excluded from damage count

---

### Asset Inventory Management

#### Create Asset
```
POST /api/assets
Body: { type, block, room, total }
```
1. Check duplicate: `Asset.findOne({ type, block, room })`
   - If exists → Error 409: "Asset already exists... Update instead"
2. Create with unique compound index validation
3. Return enriched asset: `damaged=0, working=total`

#### Update Asset
```
PUT /api/assets/:id
Body: { type, block, room, total (optional) }
```
1. If total changed:
   - Get current damage count via aggregation
   - Validate: `newTotal >= currentDamage`
   - If fails → Error 400: "Total cannot be less than active usage"
   - Set new total
2. Save & return enriched

#### Delete Asset
```
DELETE /api/assets/:id
```
- Direct deletion
- Related Issues remain (but asset no longer resolves via existence check)

---

### Comment Thread on Issues

#### Add Comment
```
POST /api/issues/:id/comments
Body: {
  text: "Comment text"
}
```
1. Find issue
2. Push to `Issue.comments[]` array:
   ```javascript
   {
     user: userId,
     text,
     createdAt: now
   }
   ```
3. Save & return populated issue

---

## TASK 4: API FLOW

### Authentication Flow

#### 1. User Login
```
POST /api/auth/login
Body: {
  email,
  password
}
Response:
{
  success: true,
  token: "JWT token",
  user: {
    _id, name, email, role, classroomId
  }
}
```
- **Process**:
  1. Find user by email
  2. Compare password with stored hash
  3. Generate JWT token
  4. Return token + user object
- **Token Usage**: Include in Authorization header: `Bearer <token>`

#### 2. User Registration (Admin Only)
```
POST /api/auth/register
Headers: Authorization: Bearer <adminToken>
Body: {
  name,
  email,
  password,
  role: 'student' | 'faculty' | 'admin' | 'hod',
  registrationNumber (if student),
  teacherId (if faculty)
}
```

#### 3. Get Current User
```
GET /api/auth/me
Headers: Authorization: Bearer <token>
```

#### 4. Change Password
```
POST /api/auth/change-password
Headers: Authorization: Bearer <token>
Body: {
  oldPassword,
  newPassword
}
```

---

### Issue Management API Flow

#### Issue Creation (Student/Faculty/Admin/HOD)
```
POST /api/issues
Headers: Authorization: Bearer <token>
         Content-Type: multipart/form-data (if uploading proof)
Body: {
  title: "Fan not working",
  description: "3 fans in room A01 are not working",
  category: "asset",
  priority: "high",
  assetType: "Fan",
  block: "Department",
  room: "A01",
  quantity: 3,
  issueType: "damaged",
  proofImage: (file upload)
}

Response: 201 Created
{
  success: true,
  message: "Issue created successfully",
  data: {
    _id,
    title,
    description,
    category,
    priority,
    status: "open",
    assetType,
    block,
    room,
    quantity,
    issueType,
    createdBy: { name, email, role },
    proofImage: "uploads/issues/filename.jpg",
    createdAt,
    updatedAt
  }
}
```

#### Get My Issues (Authenticated)
```
GET /api/issues/my?status=open&priority=high&category=asset
Headers: Authorization: Bearer <token>

Response:
{
  success: true,
  count: 5,
  data: [
    { _id, title, description, category, status, ... },
    ...
  ]
}

Role-based Behavior:
  - Students: See only their own issues (createdBy filter)
  - Faculty/Admin/HOD: See all issues (no filter)
```

#### Get All Issues (Admin/HOD Only)
```
GET /api/issues?status=open&priority=high&category=asset
Headers: Authorization: Bearer <token>

Supports Filters:
  - ?status=open|in-progress|resolved
  - ?priority=low|normal|high
  - ?category=asset|infrastructure|academic|conduct|general
```

#### Get Single Issue
```
GET /api/issues/:id
Headers: Authorization: Bearer <token>

Returns: {
  _id,
  title,
  description,
  category,
  status,
  priority,
  createdBy: { populated user },
  assignedTo: { populated user },
  comments: [
    {
      user: { populated },
      text,
      createdAt
    }
  ],
  ...
}
```

#### Update Issue Status (Faculty/Admin/HOD Only)
```
PUT /api/issues/:id/status
Headers: Authorization: Bearer <token>
Body: {
  status: "in-progress",
  priority: "high",
  assignedTo: "<staffUserId>"
}

Validation:
  - Status transitions must follow: open → in-progress → resolved
  - Cannot go backwards
  - Once resolved, terminal state

Response: 200 OK
{
  success: true,
  message: "Issue updated successfully",
  data: { updated issue }
}
```

#### Add Comment to Issue (Authenticated)
```
POST /api/issues/:id/comments
Headers: Authorization: Bearer <token>
Body: {
  text: "This has been assigned to the maintenance team"
}

Response: 201 Created
{
  success: true,
  data: { updated issue with new comment }
}
```

#### Upload Resolution Proof (Faculty/Admin/HOD)
```
POST /api/issues/:id/resolution-proof
Headers: Authorization: Bearer <token>
         Content-Type: multipart/form-data
Body: {
  resolutionFile: (image file)
}
```

---

### Asset Management API Flow

#### Create Asset (Admin Only)
```
POST /api/assets
Headers: Authorization: Bearer <adminToken>
Body: {
  type: "Fan",
  block: "Department",
  room: "A01",
  total: 10
}

Response: 201 Created
{
  success: true,
  message: "Asset created successfully",
  data: {
    _id,
    type: "Fan",
    block: "Department",
    room: "A01",
    total: 10,
    damaged: 0,           // Computed
    working: 10,          // Computed
    maintenance: 0,       // Computed (placeholder)
    createdAt,
    updatedAt
  }
}
```

#### Get All Assets with Filters (Admin/HOD)
```
GET /api/assets?block=Department&room=A01&type=Fan
Headers: Authorization: Bearer <token>

Response:
{
  success: true,
  count: 25,
  data: [
    {
      _id,
      type,
      block,
      room,
      total,
      damaged,        // Aggregated from Issues
      working,        // total - damaged
      maintenance: 0
    },
    ...
  ]
}

Aggregation Process (invisible to client):
  1. Query matching Assets
  2. For each asset, aggregate Issues:
     SUM(Issue.quantity)
     WHERE Issue.category='asset'
       AND Issue.issueType='damaged'
       AND Issue.status!='resolved'
       AND (assetType, block, room) matches Asset
  3. Calculate working = total - damaged
  4. Return enriched assets
```

#### Get Single Asset
```
GET /api/assets/:id
Headers: Authorization: Bearer <token>

Response: {
  _id,
  type,
  block,
  room,
  total,
  damaged,   // Computed on-the-fly
  working,   // Computed on-the-fly
  createdAt,
  updatedAt
}
```

#### Update Asset (Admin Only)
```
PUT /api/assets/:id
Headers: Authorization: Bearer <adminToken>
Body: {
  total: 12  // Increase total
}

Validation:
  - New total must be >= current damaged count
  - If total < damaged: Error 400

Response: 200 OK
{
  success: true,
  message: "Asset updated successfully",
  data: { updated asset with computed counts }
}
```

#### Delete Asset (Admin Only)
```
DELETE /api/assets/:id
Headers: Authorization: Bearer <adminToken>

Response: 200 OK
{
  success: true,
  message: "Asset deleted successfully"
}
```

---

### Classroom Management API Flow

#### Create Classroom (Admin Only)
```
POST /api/classrooms
Headers: Authorization: Bearer <adminToken>
Body: {
  course: "BTech",
  specialization: "CSE",
  year: 2,
  section: "A",
  block: "Main Block",
  room: "<roomId>",
  department: "Computer Science"
}

Validation:
  - Unique composite (course, specialization, year, section)
  - Year: 1-4 for BTech, 1-2 for MTech
```

#### Get All Classrooms (Admin/HOD)
```
GET /api/classrooms
```

#### Get Classroom Students (Admin Only)
```
GET /api/classrooms/:id/students
```

#### Get Available Rooms (Admin Only)
```
GET /api/classrooms/available-rooms/:block
```

---

### Project Management API Flow

#### Create Project (Faculty Only)
```
POST /api/projects
Headers: Authorization: Bearer <facultyToken>
Body: {
  projectTitle: "E-Commerce System",
  subject: "Database Design",
  description: "Build a complete e-commerce system",
  classroomId: "<classroomId>",
  deadline: "2026-05-15",
  maxTeamSize: 5
}

Response: 201 Created
{
  success: true,
  message: "Project created successfully",
  data: {
    _id,
    projectTitle,
    subject,
    description,
    facultyId,
    classroomId,
    deadline,
    maxTeamSize,
    status: "not_started",
    teamMembers: [],
    updates: [],
    createdAt,
    updatedAt
  }
}
```

#### Get My Projects (Faculty Only)
```
GET /api/projects/my
```

#### Get Projects in Classroom
```
GET /api/projects/class/:classroomId
```

#### Get Assigned Projects (Student Only)
```
GET /api/projects/assigned
```

#### Update Project Status (Team Members/Faculty)
```
PUT /api/projects/:id/status
Body: {
  status: "in_progress" | "submitted"
}
```

#### Add Project Update
```
POST /api/projects/:id/update
Body: {
  message: "Completed database schema design"
}
```

---

### Notification API Flow

#### Get Notifications (Authenticated)
```
GET /api/notifications
Headers: Authorization: Bearer <token>

Response:
{
  success: true,
  count: 5,
  data: [
    {
      _id,
      userId,
      message,
      type: 'deadline_update' | 'project_status' | 'general',
      projectId,
      isRead: false,
      createdAt
    },
    ...
  ]
}
```

#### Mark Notification as Read
```
PUT /api/notifications/:id/read
```

#### Mark All as Read
```
PUT /api/notifications/read-all
```

#### Delete Notification
```
DELETE /api/notifications/:id
```

---

### Statistics API Flow

#### Admin Stats
```
GET /api/stats/admin
Headers: Authorization: Bearer <adminToken>
```

#### Faculty Stats
```
GET /api/stats/faculty
Headers: Authorization: Bearer <facultyToken>
```

#### Student Stats
```
GET /api/stats/student
Headers: Authorization: Bearer <studentToken>
```

---

## Summary: Complete Data Flow

### Typical Issue Reporting Scenario

```
1. STUDENT REPORTS DAMAGE:
   POST /api/issues
   {
     category: "asset",
     assetType: "Fan",
     block: "Department",
     room: "A01",
     quantity: 3,
     issueType: "damaged"
   }
   
   ↓ SYSTEM CHECKS:
   - Asset exists? { type: "Fan", block: "Department", room: "A01" }
   - Asset total: 10
   - Aggregate current damage: 2 (from prior unresolved issues)
   - Available: 10 - 2 = 8 ✓ (8 >= 3, OK)
   
   ↓ CREATES ISSUE (no Asset modification)
   Issue { quantity: 3, status: "open", issueType: "damaged" }

2. HOD VIEWS ASSETS:
   GET /api/assets?room=A01
   
   ↓ SYSTEM CALCULATES:
   - Get Asset { type: "Fan", total: 10 }
   - Aggregate all Issues:
     * Issue 1: 2 fans, status='open'
     * Issue 2: 3 fans, status='open' (just created)
     Total = 5 damaged
   - Compute: working = 10 - 5 = 5
   
   ↓ RETURNS:
   { type: "Fan", total: 10, damaged: 5, working: 5 }

3. FACULTY RESOLVES ISSUE #1 (2 fans):
   PUT /api/issues/:id1/status
   { status: "resolved" }
   
   ↓ SETS:
   - issue.status = "resolved"
   - issue.resolvedAt = now

4. HOD VIEWS ASSETS AGAIN:
   GET /api/assets?room=A01
   
   ↓ SYSTEM RE-CALCULATES:
   - Get Asset { type: "Fan", total: 10 }
   - Aggregate all ACTIVE Issues (status != 'resolved'):
     * Issue 1: EXCLUDED (resolved)
     * Issue 2: 3 fans, status='open'
     Total = 3 damaged
   - Compute: working = 10 - 3 = 7
   
   ↓ RETURNS:
   { type: "Fan", total: 10, damaged: 3, working: 7 }

5. COMPLETE RESOLUTION OF ISSUE #2:
   PUT /api/issues/:id2/status
   { status: "resolved" }
   
   ↓ NEXT GET /api/assets returns:
   { type: "Fan", total: 10, damaged: 0, working: 10 }
```

---

## Role-Based Access Control (RBAC)

| Endpoint | Admin | HOD | Faculty | Student |
|----------|-------|-----|---------|---------|
| POST /api/issues | ✓ | ✓ | ✓ | ✓ |
| GET /api/issues | ✓ | ✓ | ✗ | ✗ |
| GET /api/issues/my | ✓ | ✓ | ✓ | ✓ (own only) |
| PUT /api/issues/:id/status | ✓ | ✓ | ✓ | ✗ |
| POST /api/assets | ✓ | ✗ | ✗ | ✗ |
| GET /api/assets | ✓ | ✓ | ✗ | ✗ |
| PUT /api/assets/:id | ✓ | ✗ | ✗ | ✗ |
| DELETE /api/assets/:id | ✓ | ✗ | ✗ | ✗ |
| POST /api/classrooms | ✓ | ✗ | ✗ | ✗ |
| GET /api/classrooms | ✓ | ✓ | ✗ | ✗ |
| POST /api/projects | ✗ | ✗ | ✓ | ✗ |
| GET /api/projects/assigned | ✗ | ✗ | ✗ | ✓ |
| PUT /api/projects/:id/status | Faculty/Students (creators/members) |

---

## Error Handling Standards

All errors follow consistent format:
```json
{
  "success": false,
  "message": "Error description"
}
```

Common Status Codes:
- **400**: Bad Request (validation failed)
- **401**: Unauthorized (no token)
- **403**: Forbidden (insufficient role)
- **404**: Not Found (resource missing)
- **409**: Conflict (duplicate asset, etc.)
- **500**: Server Error

---

## Summary Table

| Aspect | Details |
|--------|---------|
| **Total Collections** | 10 (User, Classroom, Room, Asset, Issue, Utility, Lab, Project, Notification, Timetable) |
| **Total Relationships** | 20+ (1:1, 1:N, M:N via arrays and implicit joins) |
| **Key Workflow** | Issue Creation → Asset Validation → Aggregation on Read → Resolution → Auto-exclusion |
| **Computed Fields** | Asset.damaged (from Issues), Asset.working (total - damaged) |
| **Status Lifecycle** | open → in-progress → resolved (unidirectional, terminal end state) |
| **Authorization Model** | Role-based (admin, faculty, student, hod) |
| **Main API Routes** | /api/{auth, issues, assets, classrooms, projects, labs, utilities, timetables, notifications, stats} |

