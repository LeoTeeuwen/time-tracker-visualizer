package com.timetracker

import android.app.usage.UsageStatsManager
import android.content.Intent
import android.provider.Settings
import android.app.AppOpsManager
import android.content.Context
import android.os.Process
import com.facebook.react.bridge.*
import java.util.*
import java.util.SortedMap
import java.util.TreeMap
import android.app.usage.UsageStats
import android.util.Log
import android.Manifest
import android.content.pm.PackageManager
import androidx.core.content.ContextCompat

class UsageStatsModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "UsageStatsModule"

    @ReactMethod
    fun checkPermission(promise: Promise) {
        val appOps = reactApplicationContext.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
        val mode = appOps.checkOpNoThrow(
            AppOpsManager.OPSTR_GET_USAGE_STATS,
            Process.myUid(),
            reactApplicationContext.packageName
        )

        promise.resolve(mode == AppOpsManager.MODE_ALLOWED)
    }

    @ReactMethod
    fun openSettings() {
        val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        reactApplicationContext.startActivity(intent)
    }

    @ReactMethod
    fun getAppUsageTime(startTime: Double, endTime: Double, promise: Promise) {
        val usageStatsManager = reactApplicationContext.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val stats = usageStatsManager.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, startTime.toLong(), endTime.toLong())
        
        val resultArray = Arguments.createArray()
        for (usageStat in stats) {
            if (usageStat.totalTimeInForeground > 0) {
                val appMap = Arguments.createMap()
                appMap.putString("packageName", usageStat.packageName)
                appMap.putDouble("totalTimeInForeground", usageStat.totalTimeInForeground.toDouble())
                resultArray.pushMap(appMap)
            }
        }
        promise.resolve(resultArray)
    }

    @ReactMethod
    fun getFocusedApp(promise: Promise) {
        try {
            var currentApp = "UNKNOWN"
            val usm = reactApplicationContext.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
            val time = System.currentTimeMillis()
            
            // Query for application usage stats in the last 10 seconds
            val appList = usm.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, time - 1000 * 10, time)
            
            if (appList != null && appList.isNotEmpty()) {
                val mySortedMap: SortedMap<Long, UsageStats> = TreeMap()
                for (usageStats in appList) {
                    mySortedMap[usageStats.lastTimeUsed] = usageStats
                }
                if (mySortedMap.isNotEmpty()) {
                    currentApp = mySortedMap[mySortedMap.lastKey()]?.packageName ?: "UNKNOWN"
                }
            }
            promise.resolve(currentApp)
        } catch (e: Exception) {
            promise.reject("ERROR_GETTING_APP", e.message, e)
        }
    }
}
