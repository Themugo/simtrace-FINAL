# Individual User Dashboard Prototype

## Overview
Dashboard prototype for individual device owners.

## Dashboard Layout

```
┌─────────────────────────────────────────────────────────────┐
│  [Logo] SimTrace          [Search] [Notifications] [Profile]│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Welcome back, John!                               │    │
│  │  You have 3 devices tracked                        │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌──────────────────────┐  ┌──────────────────────┐        │
│  │  Quick Actions       │  │  Recent Activity     │        │
│  │                      │  │                      │        │
│  │  [Add Device]        │  │  • iPhone 13 moved   │        │
│  │  [Check IMEI]        │  │  • MacBook Pro online │        │
│  │  [Report Theft]      │  │  • iPad Air offline   │        │
│  │  [View All Devices]  │  │  • Alert: Device left │        │
│  │                      │  │    safe zone          │        │
│  └──────────────────────┘  └──────────────────────┘        │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Your Devices                                       │    │
│  │                                                      │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │    │
│  │  │  iPhone 13  │  │ MacBook Pro │  │  iPad Air   │ │    │
│  │  │  [Map Icon] │  │ [Map Icon]  │  │ [Map Icon]  │ │    │
│  │  │  Online     │  │  Online     │  │  Offline    │ │    │
│  │  │  Battery: 85%│  │ Battery: 92%│  │ Battery: -- │ │    │
│  │  │  Last seen:  │  │ Last seen:  │  │ Last seen:  │ │    │
│  │  │  2 min ago   │  │ 5 min ago   │  │ 2 hours ago│ │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘ │    │
│  │                                                      │    │
│  │  [View All Devices]                                  │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Alerts & Notifications                              │    │
│  │                                                      │    │
│  │  ⚠️  Device left safe zone (iPhone 13)              │    │
│  │     10 minutes ago                                   │    │
│  │                                                      │    │
│  │  ℹ️  MacBook Pro came online                         │    │
│  │     1 hour ago                                       │    │
│  │                                                      │    │
│  │  [View All Alerts]                                   │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Page: Device Detail

```
┌─────────────────────────────────────────────────────────────┐
│  [← Back] iPhone 13                 [Edit] [Delete] [Share]│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Device Information                                  │    │
│  │                                                      │    │
│  │  Name: iPhone 13                                      │    │
│  │  IMEI: 356938090643522                               │    │
│  │  Type: Smartphone                                    │    │
│  │  Status: Online                                      │    │
│  │  Battery: 85%                                       │    │
│  │  Last Seen: 2 minutes ago                           │    │
│  │  Added: January 15, 2024                             │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Real-Time Location                                  │    │
│  │                                                      │    │
│  │           [MAP DISPLAY]                              │    │
│  │                                                      │    │
│  │  Current Location: 123 Main St, New York, NY        │    │
│  │  Accuracy: 10 meters                                 │    │
│  │  [Refresh] [Share Location]                          │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Location History                                    │    │
│  │                                                      │    │
│  │  Date Range: [Today] [This Week] [This Month] [Custom]│    │
│  │                                                      │    │
│  │  [Timeline Map]                                      │    │
│  │                                                      │    │
│  │  [Export History]                                    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  IMEI Status                                         │    │
│  │                                                      │    │
│  │  IMEI: 356938090643522                               │    │
│  │  Status: ✅ Not Blacklisted                          │    │
│  │  Last Checked: 5 minutes ago                         │    │
│  │  [Check Again]                                       │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Alerts & Safe Zones                                 │    │
│  │                                                      │    │
│  │  Safe Zones:                                         │    │
│  │  • Home (123 Main St, New York, NY)                 │    │
│  │  • Work (456 Oak Ave, New York, NY)                 │    │
│  │                                                      │    │
│  │  [Add Safe Zone] [Edit Safe Zones]                  │    │
│  │                                                      │    │
│  │  Alert Settings:                                     │    │
│  │  [ ] Notify when device leaves safe zone            │    │
│  │  [ ] Notify when device enters safe zone             │    │
│  │  [ ] Notify when battery below 20%                   │    │
│  │  [ ] Notify when device goes offline                 │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Page: IMEI Check

```
┌─────────────────────────────────────────────────────────────┐
│  [Logo] SimTrace          [Search] [Notifications] [Profile]│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  IMEI Check                                          │    │
│  │                                                      │    │
│  │  Enter IMEI number to check blacklist status:        │    │
│  │                                                      │    │
│  │  IMEI: [_________________]                          │    │
│  │                                                      │    │
│  │  [       Check IMEI       ]                         │    │
│  │                                                      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Recent IMEI Checks                                  │    │
│  │                                                      │    │
│  │  IMEI                  Status        Date             │    │
│  │  356938090643522     ✅ Clean      Jan 30, 2024     │    │
│  │  356938090643523     ⚠️ Blacklisted Jan 29, 2024     │    │
│  │  356938090643524     ✅ Clean      Jan 28, 2024     │    │
│  │                                                      │    │
│  │  [View All Checks]                                   │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Page: Report Theft

```
┌─────────────────────────────────────────────────────────────┐
│  [← Back] Report Theft                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Report Stolen Device                                │    │
│  │                                                      │    │
│  │  Select Device:                                       │    │
│  │  [iPhone 13 ▼]                                       │    │
│  │                                                      │    │
│  │  Date of Theft: [January 30, 2024 ▼]                │    │
│  │                                                      │    │
│  │  Location of Theft:                                   │    │
│  │  [_____________________________]                     │    │
│  │                                                      │    │
│  │  Description:                                        │    │
│  │  [______________________________________________]   │    │
│  │  [______________________________________________]   │    │
│  │                                                      │    │
│  │  Police Report Number (optional):                    │    │
│  │  [_________________]                                │    │
│  │                                                      │    │
│  │  Upload Police Report (optional):                     │    │
│  │  [Choose File]                                        │    │
│  │                                                      │    │
│  │  [ ] I confirm this device has been stolen            │    │
│  │                                                      │    │
│  │  [       Submit Report       ]                       │    │
│  │                                                      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Page: Settings

```
┌─────────────────────────────────────────────────────────────┐
│  [Logo] SimTrace          [Search] [Notifications] [Profile]│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Settings                                            │    │
│  │                                                      │    │
│  │  Profile                                             │    │
│  │  ┌─────────────────────────────────────────────┐    │    │
│  │  │ Name: John Smith                             │    │    │
│  │  │ Email: john@example.com                       │    │    │
│  │  │ Phone: +1 555-123-4567                       │    │    │
│  │  │ [Edit Profile]                                │    │    │
│  │  └─────────────────────────────────────────────┘    │    │
│  │                                                      │    │
│  │  Security                                            │    │
│  │  ┌─────────────────────────────────────────────┐    │    │
│  │  │ Password: ••••••••••••                       │    │    │
│  │  │ 2FA: Enabled (Authenticator App)             │    │    │
│  │  │ [Change Password] [Manage 2FA]               │    │    │
│  │  └─────────────────────────────────────────────┘    │    │
│  │                                                      │    │
│  │  Notifications                                       │    │
│  │  ┌─────────────────────────────────────────────┐    │    │
│  │  │ [ ] Email notifications                      │    │    │
│  │  │ [ ] Push notifications                       │    │    │
│  │  │ [ ] SMS notifications                        │    │    │
│  │  │ [Edit Notification Preferences]              │    │    │
│  │  └─────────────────────────────────────────────┘    │    │
│  │                                                      │    │
│  │  Subscription                                        │    │
│  │  ┌─────────────────────────────────────────────┐    │    │
│  │  │ Plan: Free                                    │    │    │
│  │  │ Devices: 3/5 used                            │    │    │
│  │  │ [Upgrade to Pro] [Manage Subscription]        │    │    │
│  │  └─────────────────────────────────────────────┘    │    │
│  │                                                      │    │
│  │  Privacy                                             │    │
│  │  ┌─────────────────────────────────────────────┐    │    │
│  │  │ [Download My Data]                           │    │    │
│  │  │ [Delete My Account]                          │    │    │
│  │  └─────────────────────────────────────────────┘    │    │
│  │                                                      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Mobile View (Responsive)

```
┌─────────────────────────┐
│ [☰] SimTrace    [🔔]  │
├─────────────────────────┤
│                         │
│ Welcome back, John!     │
│                         │
│ ┌─────────────────────┐ │
│ │ Quick Actions       │ │
│ │                     │ │
│ │ [Add Device]        │ │
│ │ [Check IMEI]        │ │
│ │ [Report Theft]      │ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │ Your Devices        │ │
│ │                     │ │
│ │ iPhone 13           │ │
│ │ [Map] Online 85%    │ │
│ │                     │ │
│ │ MacBook Pro         │ │
│ │ [Map] Online 92%    │ │
│ │                     │ │
│ │ iPad Air            │ │
│ │ [Map] Offline --    │ │
│ │                     │ │
│ │ [View All]          │ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │ Alerts              │ │
│ │                     │ │
│ │ ⚠️ Device left safe │ │
│ │    zone (iPhone 13) │ │
│ │                     │ │
│ │ [View All]          │ │
│ └─────────────────────┘ │
│                         │
│ [Dashboard] [Devices]   │
│ [IMEI] [Settings]      │
└─────────────────────────┘
```
