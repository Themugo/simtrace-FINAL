# Business User Dashboard Prototype

## Overview
Dashboard prototype for business users with multiple devices and team members.

## Dashboard Layout

```
┌─────────────────────────────────────────────────────────────┐
│  [Logo] SimTrace Business  [Search] [Notifications] [Profile]│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Welcome back, Sarah!                               │    │
│  │  Acme Corp - Business Plan                         │    │
│  │  25 devices tracked, 5 team members                │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌──────────────────────┐  ┌──────────────────────┐        │
│  │  Quick Actions       │  │  Team Activity       │        │
│  │                      │  │                      │        │
│  │  [Add Device]        │  │  John added 3 devices│        │
│  │  [Bulk Import]       │  │  Mike checked IMEI    │        │
│  │  [Invite Member]     │  │  Lisa reported theft  │        │
│  │  [Generate Report]   │  │  Tom updated device    │        │
│  │  [View All Devices]  │  │    assignment          │        │
│  │                      │  │                      │        │
│  └──────────────────────┘  └──────────────────────┘        │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Device Overview                                    │    │
│  │                                                      │    │
│  │  Total Devices: 25                                  │    │
│  │  Online: 20 | Offline: 5 | Stolen: 0                │    │
│  │                                                      │    │
│  │  [Device Status Chart]                               │    │
│  │                                                      │    │
│  │  Devices by Type:                                    │    │
│  │  Smartphones: 15 (60%)                              │    │
│  │  Laptops: 8 (32%)                                    │    │
│  │  Tablets: 2 (8%)                                    │    │
│  │                                                      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Recent Devices                                      │    │
│  │                                                      │    │
│  │  Device        Type    Status    Assigned To    Battery│    │
│  │  iPhone 13     Phone   Online    John Smith     85%   │    │
│  │  MacBook Pro   Laptop  Online    Mike Johnson   92%   │    │
│  │  iPad Air      Tablet  Offline   Lisa Davis     --    │    │
│  │  iPhone 14     Phone   Online    Tom Wilson     78%   │    │
│  │  Dell XPS      Laptop  Online    Sarah Brown    65%   │    │
│  │                                                      │    │
│  │  [View All Devices] [Manage Devices]                │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Usage Analytics                                     │    │
│  │                                                      │    │
│  │  [Usage Chart - Last 30 Days]                        │    │
│  │                                                      │    │
│  │  Total IMEI Checks: 150                             │    │
│  │  Total Location Requests: 320                       │    │
│  │  Total Alerts: 12                                   │    │
│  │                                                      │    │
│  │  [View Full Analytics]                               │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Alerts & Notifications                              │    │
│  │                                                      │    │
│  │  ⚠️  3 devices offline (iPad Air, Surface Pro, etc) │    │
│  │     30 minutes ago                                   │    │
│  │                                                      │    │
│  │  ℹ️  New team member invitation accepted             │    │
│  │     2 hours ago                                       │    │
│  │                                                      │    │
│  │  [View All Alerts]                                   │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Page: Device Management

```
┌─────────────────────────────────────────────────────────────┐
│  [Logo] SimTrace Business  [Search] [Notifications] [Profile]│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Device Management                                   │    │
│  │                                                      │    │
│  │  Search: [_________________]  Filter: [All ▼]        │    │
│  │                                                      │    │
│  │  [Add Device] [Bulk Import] [Export List]            │    │
│  │                                                      │    │
│  │  ┌─────────────────────────────────────────────┐    │    │
│  │  │ Device        Type    Status    Assigned   │    │    │
│  │  │ iPhone 13     Phone   Online    John Smith  │    │    │
│  │  │ [View] [Edit] [Delete] [Assign]             │    │    │
│  │  ├─────────────────────────────────────────────┤    │    │
│  │  │ MacBook Pro   Laptop  Online    Mike Johns  │    │    │
│  │  │ [View] [Edit] [Delete] [Assign]             │    │    │
│  │  ├─────────────────────────────────────────────┤    │    │
│  │  │ iPad Air      Tablet  Offline   Lisa Davis  │    │    │
│  │  │ [View] [Edit] [Delete] [Assign]             │    │    │
│  │  ├─────────────────────────────────────────────┤    │    │
│  │  │ iPhone 14     Phone   Online    Tom Wilson  │    │    │
│  │  │ [View] [Edit] [Delete] [Assign]             │    │    │
│  │  └─────────────────────────────────────────────┘    │    │
│  │                                                      │    │
│  │  Showing 1-4 of 25 devices                           │    │
│  │  [Previous] [1] [2] [3] [Next]                      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Page: Team Management

```
┌─────────────────────────────────────────────────────────────┐
│  [Logo] SimTrace Business  [Search] [Notifications] [Profile]│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Team Management                                     │    │
│  │                                                      │    │
│  │  [Invite Member] [Manage Roles] [Activity Log]       │    │
│  │                                                      │    │
│  │  ┌─────────────────────────────────────────────┐    │    │
│  │  │ Name           Email               Role      │    │    │
│  │  │ John Smith     john@acme.com       Admin     │    │    │
│  │  │ [View] [Edit] [Remove]                   │    │    │
│  │  ├─────────────────────────────────────────────┤    │    │
│  │  │ Mike Johnson   mike@acme.com       Member    │    │    │
│  │  │ [View] [Edit] [Remove]                   │    │    │
│  │  ├─────────────────────────────────────────────┤    │    │
│  │  │ Lisa Davis     lisa@acme.com       Member    │    │    │
│  │  │ [View] [Edit] [Remove]                   │    │    │
│  │  ├─────────────────────────────────────────────┤    │    │
│  │  │ Tom Wilson     tom@acme.com        Member    │    │    │
│  │  │ [View] [Edit] [Remove]                   │    │    │
│  │  └─────────────────────────────────────────────┘    │    │
│  │                                                      │    │
│  │  Total Members: 5 | Admins: 2 | Members: 3          │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Page: Reports

```
┌─────────────────────────────────────────────────────────────┐
│  [Logo] SimTrace Business  [Search] [Notifications] [Profile]│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Reports                                             │    │
│  │                                                      │    │
│  │  Report Type: [Device Usage ▼]                       │    │
│  │  Date Range: [Last 30 Days ▼]                        │    │
│  │                                                      │    │
│  │  [Generate Report] [Schedule Report]                 │    │
│  │                                                      │    │
│  │  ┌─────────────────────────────────────────────┐    │    │
│  │  │ Saved Reports                                │    │    │
│  │  │                                             │    │    │
│  │  │ • Device Usage Report - January 2024        │    │    │
│  │  │   [View] [Download] [Share] [Delete]        │    │    │
│  │  │                                             │    │    │
│  │  │ • IMEI Check Report - January 2024          │    │    │
│  │  │   [View] [Download] [Share] [Delete]        │    │    │
│  │  │                                             │    │    │
│  │  │ • Team Activity Report - January 2024      │    │    │
│  │  │   [View] [Download] [Share] [Delete]        │    │    │
│  │  │                                             │    │    │
│  │  └─────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Page: Settings

```
┌─────────────────────────────────────────────────────────────┐
│  [Logo] SimTrace Business  [Search] [Notifications] [Profile]│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Settings                                            │    │
│  │                                                      │    │
│  │  Company Profile                                     │    │
│  │  ┌─────────────────────────────────────────────┐    │    │
│  │  │ Company Name: Acme Corp                     │    │    │
│  │  │ Email: contact@acme.com                      │    │    │
│  │  │ Phone: +1 555-123-4567                       │    │    │
│  │  │ Address: 123 Business St, New York, NY       │    │    │
│  │  │ [Edit Profile]                                │    │    │
│  │  └─────────────────────────────────────────────┘    │    │
│  │                                                      │    │
│  │  Security                                            │    │
│  │  ┌─────────────────────────────────────────────┐    │    │
│  │  │ 2FA: Enabled for all admins                  │    │    │
│  │  │ SSO: Not configured                          │    │    │
│  │  │ [Manage Security]                             │    │    │
│  │  └─────────────────────────────────────────────┘    │    │
│  │                                                      │    │
│  │  Billing                                             │    │
│  │  ┌─────────────────────────────────────────────┐    │    │
│  │  │ Plan: Business ($49/month)                   │    │    │
│  │  │ Devices: 25/100 used                         │    │    │
│  │  │ Team Members: 5/10 used                      │    │    │
│  │  │ Next Billing: February 1, 2024               │    │    │
│  │  │ [Manage Subscription] [View Invoices]        │    │    │
│  │  └─────────────────────────────────────────────┘    │    │
│  │                                                      │    │
│  │  Integrations                                        │    │
│  │  ┌─────────────────────────────────────────────┐    │    │
│  │  │ [ ] Slack Integration                        │    │    │
│  │  │ [ ] Microsoft Teams Integration              │    │    │
│  │  │ [ ] Google Workspace Integration            │    │    │
│  │  │ [Configure Integrations]                      │    │    │
│  │  └─────────────────────────────────────────────┘    │    │
│  │                                                      │    │
│  │  API Access                                          │    │
│  │  ┌─────────────────────────────────────────────┐    │    │
│  │  │ API Key: sk_live_xxxxxxxxxxxxxx              │    │    │
│  │  │ [Regenerate Key] [View API Docs]             │    │    │
│  │  └─────────────────────────────────────────────┘    │    │
│  │                                                      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```
