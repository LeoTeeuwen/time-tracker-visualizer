package com.timetracker

import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.provider.Settings
import com.facebook.react.bridge.*
import java.util.*

class UsageStatsModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "UsageStatsModule"

    @ReactMethod
    fun checkPermission(promise: Promise) {
        val usageStatsManager = reactApplicationContext.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val endTime = System.currentTimeMillis()
        val startTime = endTime - 1000 * 60
        val stats = usageStatsManager.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, startTime, endTime)
        promise.resolve(stats != null && stats.isNotEmpty())
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
}
