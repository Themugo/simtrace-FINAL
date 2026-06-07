# Police and Telecom Module Testing Guide

## Prerequisites

1. Backend server running on http://localhost:3000 or https://simtrace-backend.onrender.com
2. MongoDB database connected
3. Test users seeded in database
4. Postman or similar API testing tool (optional)

## Step 1: Seed Test Users

Run the seed script to populate test users:

```bash
cd backend
npm run seed-users
```

This will create the following test users (see USER_CREDENTIALS.md for credentials):
- Admin user
- Regular user
- Police officer
- Telecom admin

## Step 2: Test Police Module

### 2.1 Police Station Management

#### Create Police Station

**Endpoint:** `POST /api/police/station`

**Request:**
```json
{
  "stationCode": "NBO001",
  "name": "Nairobi Central Police Station",
  "jurisdiction": "Nairobi County",
  "address": "Nairobi, Kenya",
  "phone": "+254700000000",
  "email": "nairobi.central@police.go.ke",
  "stationHead": "Inspector John Doe",
  "status": "active"
}
```

**Headers:**
```
Authorization: Bearer <police-officer-token>
```

**Expected Response:**
```json
{
  "_id": "...",
  "stationCode": "NBO001",
  "name": "Nairobi Central Police Station",
  "jurisdiction": "Nairobi County",
  "status": "active",
  "createdAt": "2026-06-07T..."
}
```

#### List Police Stations

**Endpoint:** `GET /api/police/stations`

**Headers:**
```
Authorization: Bearer <police-officer-token>
```

**Expected Response:**
```json
[
  {
    "_id": "...",
    "stationCode": "NBO001",
    "name": "Nairobi Central Police Station",
    "status": "active"
  }
]
```

### 2.2 Police Report Creation

#### Create Police Report

**Endpoint:** `POST /api/police/report`

**Request:**
```json
{
  "stationId": "NBO001",
  "imei": "356938035643809",
  "reportedBy": "<user-id>",
  "incidentDate": "2026-06-07T10:00:00Z",
  "incidentLocation": {
    "lat": -1.286389,
    "lng": 36.817223,
    "address": "Nairobi CBD"
  },
  "description": "Phone stolen from coffee shop",
  "status": "pending"
}
```

**Headers:**
```
Authorization: Bearer <police-officer-token>
```

**Expected Response:**
```json
{
  "_id": "...",
  "reportNumber": "POLNBO0012026060001",
  "stationId": "NBO001",
  "imei": "356938035643809",
  "status": "pending",
  "createdAt": "2026-06-07T..."
}
```

**Verify:**
- Device status should change to "stolen" in database
- Alert should be created for the device
- Socket.io event should be emitted

### 2.3 Recovery Workflow

#### Create Recovery Workflow

**Endpoint:** `POST /api/police/recovery/workflow`

**Request:**
```json
{
  "reportId": "<report-id>",
  "imei": "356938035643809"
}
```

**Headers:**
```
Authorization: Bearer <police-officer-token>
```

**Expected Response:**
```json
{
  "_id": "...",
  "reportId": "...",
  "imei": "356938035643809",
  "stage": "reported",
  "timeline": [
    {
      "stage": "reported",
      "timestamp": "2026-06-07T..."
    }
  ]
}
```

#### Update Recovery Stage

**Endpoint:** `PATCH /api/police/recovery/workflow/<workflow-id>/stage`

**Request:**
```json
{
  "stage": "investigating",
  "location": {
    "lat": -1.286389,
    "lng": 36.817223
  },
  "notes": "Witnesses interviewed"
}
```

**Headers:**
```
Authorization: Bearer <police-officer-token>
```

**Expected Response:**
```json
{
  "_id": "...",
  "stage": "investigating",
  "timeline": [
    {
      "stage": "reported",
      "timestamp": "..."
    },
    {
      "stage": "investigating",
      "timestamp": "...",
      "location": {...},
      "notes": "Witnesses interviewed"
    }
  ]
}
```

### 2.4 Nationwide Alert

#### Create Nationwide Alert

**Endpoint:** `POST /api/police/alert/nationwide`

**Request:**
```json
{
  "imei": "356938035643809",
  "alertType": "stolen_device",
  "priority": "high",
  "description": "Samsung Galaxy S24 stolen - urgent",
  "lastKnownLocation": {
    "lat": -1.286389,
    "lng": 36.817223,
    "timestamp": "2026-06-07T10:00:00Z"
  },
  "issuedBy": "<police-officer-id>"
}
```

**Headers:**
```
Authorization: Bearer <police-officer-token>
```

**Expected Response:**
```json
{
  "_id": "...",
  "imei": "356938035643809",
  "alertType": "stolen_device",
  "priority": "high",
  "issuedAt": "2026-06-07T...",
  "expiresAt": "2026-07-07T..."
}
```

**Verify:**
- Socket.io event should be emitted to all law enforcement rooms
- Alert should be visible in police dashboard

## Step 3: Test Telecom Module

### 3.1 SIM Card Tracking

#### Register SIM Card

**Endpoint:** `POST /api/telecom/sim/register`

**Request:**
```json
{
  "iccid": "89910000000000000001",
  "imsi": "639010000000000",
  "msisdn": "+254700000000",
  "operator": "safaricom",
  "status": "active",
  "associatedDevice": "356938035643809"
}
```

**Headers:**
```
Authorization: Bearer <telecom-admin-token>
```

**Expected Response:**
```json
{
  "_id": "...",
  "iccid": "89910000000000000001",
  "operator": "safaricom",
  "status": "active",
  "registeredAt": "2026-06-07T..."
}
```

#### Update SIM Location

**Endpoint:** `POST /api/telecom/sim/location`

**Request:**
```json
{
  "iccid": "89910000000000000001",
  "location": {
    "lat": -1.286389,
    "lng": 36.817223,
    "cellTowerId": "NBO001"
  }
}
```

**Headers:**
```
Authorization: Bearer <telecom-admin-token>
```

**Expected Response:**
```json
{
  "_id": "...",
  "iccid": "89910000000000000001",
  "lastActivity": "2026-06-07T..."
}
```

#### Flag SIM as Stolen

**Endpoint:** `POST /api/telecom/sim/flag-stolen`

**Request:**
```json
{
  "iccid": "89910000000000000001",
  "reportedBy": "<telecom-admin-id>",
  "reason": "Reported by owner as stolen"
}
```

**Headers:**
```
Authorization: Bearer <telecom-admin-token>
```

**Expected Response:**
```json
{
  "_id": "...",
  "iccid": "89910000000000000001",
  "status": "reported_stolen"
}
```

**Verify:**
- Alert should be created for associated device
- Socket.io event should be emitted

### 3.2 Network Activity Tracking

#### Track Call Activity

**Endpoint:** `POST /api/telecom/activity/call`

**Request:**
```json
{
  "iccid": "89910000000000000001",
  "destination": "+254711111111",
  "duration": 300
}
```

**Headers:**
```
Authorization: Bearer <telecom-admin-token>
```

**Expected Response:**
```json
{
  "_id": "...",
  "iccid": "89910000000000000001",
  "activityType": "call",
  "timestamp": "2026-06-07T...",
  "details": {
    "destination": "+254711111111",
    "duration": 300
  }
}
```

#### Track SMS Activity

**Endpoint:** `POST /api/telecom/activity/sms`

**Request:**
```json
{
  "iccid": "89910000000000000001",
  "destination": "+254711111111"
}
```

**Headers:**
```
Authorization: Bearer <telecom-admin-token>
```

**Expected Response:**
```json
{
  "_id": "...",
  "iccid": "89910000000000000001",
  "activityType": "sms",
  "timestamp": "2026-06-07T...",
  "details": {
    "destination": "+254711111111"
  }
}
```

### 3.3 Cell Tower Triangulation

#### Triangulate Device Location

**Endpoint:** `POST /api/telecom/triangulate`

**Request:**
```json
{
  "imei": "356938035643809"
}
```

**Headers:**
```
Authorization: Bearer <telecom-admin-token>
```

**Expected Response:**
```json
{
  "lat": -1.286389,
  "lng": 36.817223,
  "accuracy": 50,
  "cellTowers": [],
  "timestamp": "2026-06-07T..."
}
```

#### Register Cell Tower

**Endpoint:** `POST /api/telecom/tower/register`

**Request:**
```json
{
  "towerId": "NBO001",
  "operator": "safaricom",
  "location": {
    "lat": -1.286389,
    "lng": 36.817223,
    "address": "Nairobi CBD"
  },
  "coverageRadius": 10,
  "status": "active"
}
```

**Headers:**
```
Authorization: Bearer <telecom-admin-token>
```

**Expected Response:**
```json
{
  "_id": "...",
  "towerId": "NBO001",
  "operator": "safaricom",
  "status": "active"
}
```

## Step 4: Test Frontend Dashboards

### 4.1 Police Dashboard

1. Login as police officer (see USER_CREDENTIALS.md)
2. Navigate to `/police/dashboard`
3. Verify:
   - Statistics cards display correctly
   - Recent reports list shows data
   - Quick action buttons work
   - Station name displays in header

### 4.2 Telecom Dashboard

1. Login as telecom admin (see USER_CREDENTIALS.md)
2. Navigate to `/telecom/dashboard`
3. Verify:
   - Statistics cards display correctly
   - Recent activity list shows data
   - Quick action buttons work
   - Operator name displays in header

## Step 5: Test Integration

### 5.1 End-to-End Police Workflow

1. User reports device as stolen via frontend
2. Police officer creates police report
3. Recovery workflow is initiated
4. Nationwide alert is issued
5. Device status changes to "stolen"
6. Alert is visible in dashboard

### 5.2 End-to-End Telecom Workflow

1. SIM card is registered
2. SIM location is updated
3. SIM swap is detected
4. Alert is created
5. Cell tower triangulation is performed
6. Location is returned

## Test Results Checklist

### Police Module
- [ ] Police station created successfully
- [ ] Police stations listed successfully
- [ ] Police report created successfully
- [ ] Device status changed to "stolen"
- [ ] Alert created for device
- [ ] Recovery workflow created
- [ ] Recovery stage updated
- [ ] Nationwide alert created
- [ ] Socket.io events emitted
- [ ] Police dashboard displays data

### Telecom Module
- [ ] SIM card registered successfully
- [ ] SIM location updated successfully
- [ ] SIM flagged as stolen successfully
- [ ] Alert created for SIM swap
- [ ] Call activity tracked successfully
- [ ] SMS activity tracked successfully
- [ ] Cell tower triangulation successful
- [ ] Cell tower registered successfully
- [ ] Telecom dashboard displays data

## Troubleshooting

### Authentication Errors
- Verify user credentials from USER_CREDENTIALS.md
- Check that user has correct role (police officer, telecom admin)
- Ensure JWT token is valid

### 404 Errors
- Verify backend server is running
- Check endpoint URLs are correct
- Ensure routes are mounted in server.ts

### Database Errors
- Verify MongoDB connection
- Check that seed-users script ran successfully
- Ensure database indexes are created

### Socket.io Events Not Received
- Verify Socket.io server is initialized
- Check that client is connected to correct room
- Ensure event names match

## Next Steps

After successful testing:
1. Document any issues found
2. Fix any bugs discovered
3. Update test cases if needed
4. Prepare for production deployment
5. Create automated tests for regression

## Support

For issues during testing:
- Check backend logs: `backend/logs/`
- Check database: Connect to MongoDB Atlas
- Review API documentation: API_DOCUMENTATION.md
- Check user credentials: USER_CREDENTIALS.md
