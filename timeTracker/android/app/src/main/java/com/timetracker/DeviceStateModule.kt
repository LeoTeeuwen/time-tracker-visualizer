package com.timetracker

import android.content.Context
import android.os.PowerManager
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class DeviceStateModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    // This is the name exposed to React Native
    override fun getName(): String = "DeviceStateModule"

    @ReactMethod
    fun isPhoneSleeping(promise: Promise) {
        try {
            val powerManager = reactApplicationContext.getSystemService(Context.POWER_SERVICE) as PowerManager
            
            // isInteractive returns true if the device is awake and ready to interact.
            // Therefore, if it is NOT interactive, it is sleeping/screen off.
            val isSleeping = !powerManager.isInteractive
            
            promise.resolve(isSleeping)
        } catch (e: Exception) {
            promise.reject("DEVICE_STATE_ERROR", e.message)
        }
    }
}