# Priority Enum Migration Guide

## Overview

This migration updates all existing Issue documents in MongoDB to use the new priority enum values.

**Priority Mapping:**
- `Low` → `Minor`
- `Medium` → `Normal`
- `High` → `Important`
- `Critical` → `Urgent`

---

## Before You Start

✅ **Checklist:**
- [x] Schema already updated (Issue.js uses new enum: Minor, Normal, Important, Urgent)
- [x] Migration script created: `backend/scripts/migratePriority.js`
- [x] MongoDB connection configured in `.env`
- [x] No API changes needed
- [x] No data deletion involved

---

## Step 1: Run the Migration

From the backend directory:

```bash
cd backend
node scripts/migratePriority.js
```

---

## Expected Output

```
📡 Connecting to MongoDB...
✅ Connected to MongoDB successfully

📊 BEFORE MIGRATION STATISTICS:
  • Low: 15 documents
  • Medium: 28 documents
  • High: 12 documents
  • Critical: 5 documents
  • TOTAL with old values: 60

🔄 MIGRATING PRIORITY VALUES:
  ✓ Low → Minor
    - Matched: 15
    - Modified: 15
  ✓ Medium → Normal
    - Matched: 28
    - Modified: 28
  ✓ High → Important
    - Matched: 12
    - Modified: 12
  ✓ Critical → Urgent
    - Matched: 5
    - Modified: 5

✅ TOTAL DOCUMENTS MIGRATED: 60

📊 AFTER MIGRATION STATISTICS:
  • Minor: 15 documents
  • Normal: 28 documents
  • Important: 12 documents
  • Urgent: 5 documents

⚠️  VALIDATION CHECK:
  ✅ No old priority values remaining in database

═══════════════════════════════════════════
✅ MIGRATION COMPLETED SUCCESSFULLY
═══════════════════════════════════════════
  Total Documents Migrated: 60
  Duration: 2.34s
  Status: All old priority values converted

🔌 Disconnected from MongoDB
```

---

## What the Script Does

1. **Connects** to MongoDB using credentials from `.env`
2. **Checks** how many documents have each old priority value
3. **Updates** all documents:
   - Low → Minor
   - Medium → Normal
   - High → Important
   - Critical → Urgent
4. **Validates** that no old values remain
5. **Reports** results with counts and timing
6. **Disconnects** safely from database

---

## Safety Features

✅ **No Data Deletion** - Only updates priority field  
✅ **No Schema Changes** - Already updated in Issue.js  
✅ **Atomic Operations** - Each mapping updates all docs immediately  
✅ **Validation** - Checks for remaining old values after migration  
✅ **Clean Disconnection** - Closes DB connection properly  
✅ **Error Handling** - Stops immediately if any update fails  

---

## Troubleshooting

### ❌ "Cannot connect to MongoDB"

**Solution:**
- Verify `.env` has correct `MONGODB_URI`
- Check MongoDB Atlas cluster is running
- Ensure network IP is whitelisted

### ❌ "updateMany failed"

**Cause:** Schema validation error or permission issue
**Solution:**
- Ensure Issue.js enum includes new values (already done)
- Run migration BEFORE restarting application
- Check MongoDB user permissions

### ✅ "No documents to migrate"

This is fine! It means:
- All documents already have new values
- No old priority values exist in database
- System is ready to use

---

## What Happens If You Don't Run It?

❌ **API will break** when trying to save issues with validation:
```
Error: 'Critical' is not a valid enum value for path 'priority'
```

✅ **After migration:**
- All API calls work normally
- Existing issues display correctly
- New issues use new enum values

---

## After Migration

You can safely:
1. ✅ Start the application normally
2. ✅ Create new issues (use Minor/Normal/Important/Urgent)
3. ✅ Update existing issues
4. ✅ Run reports and queries
5. ✅ No additional action needed

---

## Files Modified

| File | Change |
|------|--------|
| `backend/scripts/migratePriority.js` | ✅ Created |
| `backend/models/Issue.js` | No change (already has new enum) |
| `backend/.env` | No change (runs as-is) |
| Database | ✅ Will be updated by script |

---

## Rollback (If Needed)

If something goes wrong, you can:

1. **Stop the application**
2. **Create a reverse script** that maps:
   - Minor → Low
   - Normal → Medium
   - Important → High
   - Urgent → Critical
3. **Run the reverse script**

But this is only needed if the migration fails halfway!

---

## Questions?

The script is designed to be:
- ✅ Transparent (shows all operations)
- ✅ Safe (no deletions, only updates)
- ✅ Idempotent (can run multiple times safely)
- ✅ Logged (clear before/after statistics)

Run it with confidence!
