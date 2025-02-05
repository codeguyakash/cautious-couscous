package com.prowtech

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import androidx.annotation.RequiresApi

class BootReceiver : BroadcastReceiver() {
    @RequiresApi(Build.VERSION_CODES.O)
    override fun onReceive(context: Context?, intent: Intent?) {
        if (intent?.action == Intent.ACTION_BOOT_COMPLETED) {
            Log.d("BootReceiver", "Boot completed, starting foreground service...")
            context?.let {
                val serviceIntent = Intent(it, AutoLaunchService::class.java)
                it.startForegroundService(serviceIntent)  // For Android 8+
            }
        }
    }
}

