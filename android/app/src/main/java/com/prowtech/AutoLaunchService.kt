package com.prowtech

import android.app.Service
import android.content.Intent
import android.os.IBinder
import android.util.Log

class AutoLaunchService : Service() {

    override fun onCreate() {
        super.onCreate()
        Log.d("AutoLaunchService", "Foreground Service Started. Launching app...")

        // Ensure the app starts
        val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
        launchIntent?.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)

        if (launchIntent != null) {
            startActivity(launchIntent)
            Log.d("AutoLaunchService", "MainActivity Launched")
        } else {
            Log.e("AutoLaunchService", "Failed to get Launch Intent")
        }

        // Stop service after launching app
        stopSelf()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        return START_NOT_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }
}
