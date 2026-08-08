# SimTrace Intelligence Data Audit & Graph Architecture Blueprint

**Date:** August 1, 2026  
**Phase:** 4 — Device Intelligence Graph Engine, Relationship Mapping & Investigation Core  
**Status:** Audit Complete & Graph Engine Architecture Active  

---

## 1. Intelligence Audit Overview

SimTrace stores records across primary domain boundaries:
- **Devices:** Serial numbers, IMEI 1 & 2, MAC addresses, brand, model, status (stolen, active, blacklisted, recovered).
- **SIM Cards:** IMSI, MSISDN (phone numbers), carrier, state.
- **Users / Persons:** Name, National ID, Phone number, Role, Organization.
- **Locations:** GPS coordinates, Cell Tower IDs, Wi-Fi BSSIDs, timestamp logs.
- **Cases:** Incident reports, investigating agency, priority, status.

Prior to Phase 4, relationship mapping between these domain entities was relational via foreign key pointers (`userId`, `deviceId`), making multi-hop investigation discovery (e.g., *Find all SIM cards used in devices that visited a location connected to a stolen phone in Case #102*) inefficient.

---

## 2. Intelligence Graph Architecture Paradigm

Phase 4 introduces a **Polymorphic Graph Layer** over MongoDB:

```
+---------------------------------------------------------------------------------+
|                                 GRAPH ENTITY                                   |
|   (Types: DEVICE, SIM_CARD, PHONE_NUMBER, PERSON, LOCATION, CASE, ORGANIZATION) |
+---------------------------------------+-----------------------------------------+
                                        |
                   +--------------------+--------------------+
                   |                                         |
                   v                                         v
+------------------------------------+    +------------------------------------+
|         GRAPH RELATIONSHIP         |    |        INTELLIGENCE EVENTS         |
| (Types: DEVICE_USED_SIM,           |    |  (Types: DEVICE_SEEN,              |
|  SIM_REGISTERED_TO_PERSON,         |    |   LOCATION_UPDATED,                |
|  DEVICE_LOCATED_AT,                |    |   SIM_CHANGED,                     |
|  PERSON_ASSOCIATED_CASE,           |    |   RISK_CHANGED,                    |
|  LOCATION_VISITED_BY_DEVICE...)    |    |   CASE_LINKED...)                  |
+------------------------------------+    +------------------------------------+
```

---

## 3. Data Privacy & Masking Rules

- **PII Protection:** Phone numbers (`MSISDN`) and National IDs are masked for unauthorized non-investigator users (e.g., `+254700****45`).
- **Organization Isolation:** Query traversals enforce `organizationId` boundaries unless cross-agency intelligence sharing is explicitly authorized.
- **Risk Assessment:** Dynamic scoring based on SIM swapping frequency, IMEI cloning indicators, blacklisted associations, and multi-case links.
