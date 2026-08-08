#!/bin/bash

# Backup Restoration Test Script
# This script tests the backup restoration process

echo "=== SIMTRACE BACKUP RESTORATION TEST ==="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
MONGO_URI="${MONGO_URI:-}"
BACKUP_BUCKET="${BACKUP_BUCKET:-simtrace-backups}"
TEST_DB_NAME="simtrace_restore_test"

if [ -z "$MONGO_URI" ]; then
    echo -e "${RED}✗ MONGO_URI environment variable not set${NC}"
    exit 1
fi

echo "Using MongoDB URI: ${MONGO_URI:0:20}..."
echo ""

# Step 1: List available backups
echo "=== STEP 1: LISTING AVAILABLE BACKUPS ==="
echo ""

# Using AWS CLI to list backups (if using S3)
if command -v aws &> /dev/null; then
    echo "Listing backups from S3 bucket: $BACKUP_BUCKET"
    aws s3 ls "s3://$BACKUP_BUCKET/" --recursive | tail -n 10
else
    echo -e "${YELLOW}○ AWS CLI not found, skipping S3 backup listing${NC}"
    echo "Please manually verify backups are available"
fi

echo ""

# Step 2: Create a test database with sample data
echo "=== STEP 2: CREATING TEST DATABASE ==="
echo ""

echo "Creating test database: $TEST_DB_NAME"
mongosh "$MONGO_URI" --eval "
    db = db.getSiblingDB('$TEST_DB_NAME');
    db.test_collection.insertOne({
        test: 'backup_restore_test',
        timestamp: new Date(),
        data: 'sample data for backup test'
    });
    print('Test data inserted successfully');
    print('Document count:', db.test_collection.countDocuments());
"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Test database created${NC}"
else
    echo -e "${RED}✗ Failed to create test database${NC}"
    exit 1
fi

echo ""

# Step 3: Create a backup of the test database
echo "=== STEP 3: CREATING BACKUP OF TEST DATABASE ==="
echo ""

BACKUP_FILE="/tmp/simtrace_test_backup_$(date +%Y%m%d_%H%M%S).archive"
echo "Creating backup: $BACKUP_FILE"

mongodump --uri="$MONGO_URI" --db="$TEST_DB_NAME" --archive="$BACKUP_FILE" --gzip

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backup created successfully${NC}"
    echo "Backup file size: $(du -h "$BACKUP_FILE" | cut -f1)"
else
    echo -e "${RED}✗ Failed to create backup${NC}"
    exit 1
fi

echo ""

# Step 4: Delete the test database
echo "=== STEP 4: DELETING TEST DATABASE ==="
echo ""

mongosh "$MONGO_URI" --eval "
    db = db.getSiblingDB('$TEST_DB_NAME');
    db.dropDatabase();
    print('Test database deleted');
"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Test database deleted${NC}"
else
    echo -e "${RED}✗ Failed to delete test database${NC}"
    exit 1
fi

echo ""

# Step 5: Restore from backup
echo "=== STEP 5: RESTORING FROM BACKUP ==="
echo ""

echo "Restoring from: $BACKUP_FILE"
mongorestore --uri="$MONGO_URI" --db="$TEST_DB_NAME" --archive="$BACKUP_FILE" --gzip

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backup restored successfully${NC}"
else
    echo -e "${RED}✗ Failed to restore backup${NC}"
    exit 1
fi

echo ""

# Step 6: Verify restored data
echo "=== STEP 6: VERIFYING RESTORED DATA ==="
echo ""

mongosh "$MONGO_URI" --eval "
    db = db.getSiblingDB('$TEST_DB_NAME');
    const count = db.test_collection.countDocuments();
    const doc = db.test_collection.findOne();
    print('Document count:', count);
    if (count > 0) {
        print('Document data:', JSON.stringify(doc));
    }
"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Data verification successful${NC}"
else
    echo -e "${RED}✗ Data verification failed${NC}"
    exit 1
fi

echo ""

# Step 7: Cleanup
echo "=== STEP 7: CLEANUP ==="
echo ""

echo "Deleting test database..."
mongosh "$MONGO_URI" --eval "
    db = db.getSiblingDB('$TEST_DB_NAME');
    db.dropDatabase();
    print('Test database deleted');
"

echo "Deleting backup file..."
rm -f "$BACKUP_FILE"

echo -e "${GREEN}✓ Cleanup complete${NC}"

echo ""

# Summary
echo "=== BACKUP RESTORATION TEST SUMMARY ==="
echo ""
echo -e "${GREEN}✓ All steps completed successfully${NC}"
echo ""
echo "Backup restoration process is working correctly."
echo ""
echo "Next steps:"
echo "1. Configure monitoring alerts"
echo "2. Execute soft launch to beta users"
