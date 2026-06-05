# SimTrace Mobile Agent Integration Guide

The SimTrace mobile agent sends encrypted location pings from the device to the backend.
When a device is reported stolen, the agent continues running silently, transmitting GPS, SIM, and fingerprint data.

---

## Android Agent — Quick Integration

### 1. Add dependency (OkHttp or Retrofit)
```gradle
implementation 'com.squareup.okhttp3:okhttp:4.12.0'
```

### 2. Store credentials securely (Android Keystore)
```kotlin
object SimTraceCredentials {
    // Store these in Android Keystore — never in SharedPreferences plain text
    const val API_URL    = "https://api.simtrace.site"
    const val IMEI       = TelephonyManager.getImei()  // requires READ_PHONE_STATE
    // deviceKey received from POST /api/imei/register — stored in Keystore
    val DEVICE_KEY: String get() = KeystoreHelper.get("simtrace_device_key")
}
```

### 3. Ping implementation
```kotlin
object SimTracePingService {

    private val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .build()

    suspend fun sendPing(context: Context) = withContext(Dispatchers.IO) {
        val tm  = context.getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
        val loc = getLastLocation(context) ?: return@withContext

        val payload = JSONObject().apply {
            put("imei",      SimTraceCredentials.IMEI)
            put("lat",       loc.latitude)
            put("lng",       loc.longitude)
            put("accuracy",  loc.accuracy.toInt())
            put("simIccid",  tm.simSerialNumber ?: "")
            put("networkOp", tm.networkOperatorName ?: "")
            put("fingerprint", JSONObject().apply {
                put("osVersion",    Build.VERSION.RELEASE)
                put("buildId",      Build.ID)
                put("networkMac",   getMacAddress())
                put("bluetoothMac", getBluetoothMac())
                put("screenRes",    getScreenResolution(context))
            })
        }

        val request = Request.Builder()
            .url("${SimTraceCredentials.API_URL}/api/track")
            .post(payload.toString().toRequestBody("application/json".toMediaType()))
            .header("X-Device-Key", SimTraceCredentials.DEVICE_KEY)
            .build()

        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) {
                Log.w("SimTrace", "Ping failed: ${response.code}")
            }
        }
    }
}
```

### 4. Poll for remote commands
```kotlin
suspend fun pollCommands(context: Context) = withContext(Dispatchers.IO) {
    val deviceId = getDeviceMongoId() // stored after registration
    val request  = Request.Builder()
        .url("${SimTraceCredentials.API_URL}/api/devices/$deviceId/commands")
        .header("X-Device-Key", SimTraceCredentials.DEVICE_KEY)
        .build()

    client.newCall(request).execute().use { response ->
        val body     = response.body?.string() ?: return@use
        val commands = JSONObject(body).getJSONArray("commands")

        for (i in 0 until commands.length()) {
            val cmd = commands.getJSONObject(i)
            when (cmd.getString("command")) {
                "lock"  -> lockDevice(context)
                "unlock"-> unlockDevice(context)
                "ring"  -> ringAlarm(context)
                "wipe"  -> factoryReset(context)  // requires device admin
            }
            // Acknowledge
            acknowledgeCommand(deviceId, cmd.getString("_id"), "executed")
        }
    }
}

fun lockDevice(context: Context) {
    val dpm = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
    dpm.lockNow() // requires BIND_DEVICE_ADMIN permission
}
```

### 5. Background WorkManager job (pings every 60s)
```kotlin
class SimTraceWorker(ctx: Context, params: WorkerParameters) : CoroutineWorker(ctx, params) {
    override suspend fun doWork(): Result {
        return try {
            SimTracePingService.sendPing(applicationContext)
            pollCommands(applicationContext)
            Result.success()
        } catch (e: Exception) {
            Log.e("SimTrace", "Worker error", e)
            Result.retry()
        }
    }
}

// In Application.onCreate():
fun scheduleAgent() {
    val constraints = Constraints.Builder()
        .setRequiredNetworkType(NetworkType.CONNECTED)
        .build()

    val request = PeriodicWorkRequestBuilder<SimTraceWorker>(60, TimeUnit.SECONDS)
        .setConstraints(constraints)
        .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 30, TimeUnit.SECONDS)
        .build()

    WorkManager.getInstance(this).enqueueUniquePeriodicWork(
        "simtrace_agent",
        ExistingPeriodicWorkPolicy.KEEP,
        request
    )
}
```

### 6. Required AndroidManifest.xml permissions
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
<uses-permission android:name="android.permission.READ_PHONE_STATE" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.BLUETOOTH" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
<!-- Device admin (for remote lock) -->
<receiver android:name=".SimTraceAdminReceiver"
    android:permission="android.permission.BIND_DEVICE_ADMIN">
    <meta-data android:name="android.app.device_admin"
               android:resource="@xml/device_admin_policies" />
    <intent-filter>
        <action android:name="android.app.action.DEVICE_ADMIN_ENABLED" />
    </intent-filter>
</receiver>
```

### 7. Device registration on first launch
```kotlin
suspend fun registerDevice(context: Context) {
    val jwt = getAuthToken() // user must have logged in to SimTrace
    val tm  = context.getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager

    val payload = JSONObject().apply {
        put("imei",  tm.imei ?: tm.meid)
        put("make",  Build.MANUFACTURER)
        put("model", Build.MODEL)
    }

    val request = Request.Builder()
        .url("${SimTraceCredentials.API_URL}/api/imei/register")
        .post(payload.toString().toRequestBody("application/json".toMediaType()))
        .header("Authorization", "Bearer $jwt")
        .build()

    client.newCall(request).execute().use { response ->
        val body      = JSONObject(response.body!!.string())
        val deviceKey = body.getString("deviceKey")
        val deviceId  = body.getString("_id")

        // ⚠️ Store in Android Keystore — never SharedPreferences
        KeystoreHelper.store("simtrace_device_key", deviceKey)
        KeystoreHelper.store("simtrace_device_id",  deviceId)
    }
}
```

---

## iOS Agent (Swift)

### URLSession ping
```swift
func sendPing(location: CLLocation) async throws {
    let payload: [String: Any] = [
        "imei":      getIMEI(),   // MEID on newer iOS; use vendor ID as fallback
        "lat":       location.coordinate.latitude,
        "lng":       location.coordinate.longitude,
        "accuracy":  Int(location.horizontalAccuracy),
        "networkOp": CTCarrier().carrierName ?? "",
        "fingerprint": [
            "osVersion": UIDevice.current.systemVersion,
            "buildId":   Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? ""
        ]
    ]

    var request = URLRequest(url: URL(string: "\(apiURL)/api/track")!)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.setValue(deviceKey, forHTTPHeaderField: "X-Device-Key")
    request.httpBody = try JSONSerialization.data(withJSONObject: payload)

    let (_, response) = try await URLSession.shared.data(for: request)
    guard (response as? HTTPURLResponse)?.statusCode == 200 else { throw PingError.failed }
}
```

### Background fetch (iOS 13+)
```swift
BGTaskScheduler.shared.register(forTaskWithIdentifier: "site.simtrace.ping", using: nil) { task in
    Task {
        try? await SimTraceAgent.shared.sendPing()
        task.setTaskCompleted(success: true)
    }
    self.scheduleNextPing()
}
```

---

## API Reference for Agent

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/track` | POST | X-Device-Key | Send location ping |
| `/api/devices/:id/commands` | GET | X-Device-Key | Poll for commands |
| `/api/devices/:id/commands/:cmdId` | PATCH | X-Device-Key | Acknowledge command |
| `/api/imei/register` | POST | JWT | Register on first launch |

### Ping payload
```json
{
  "imei":      "356938035643809",
  "lat":       -1.2921,
  "lng":       36.8219,
  "accuracy":  15,
  "simIccid":  "8954030000012345",
  "networkOp": "Safaricom",
  "fingerprint": {
    "osVersion":    "Android 14",
    "buildId":      "UP1A.231005.007",
    "networkMac":   "aa:bb:cc:dd:ee:ff",
    "bluetoothMac": "11:22:33:44:55:66",
    "screenRes":    "1080x2340"
  }
}
```
