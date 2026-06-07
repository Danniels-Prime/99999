package com.overlay;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import androidx.core.app.NotificationCompat;

public class ClipboardMonitorService extends Service {
    private static final String CHANNEL_ID = "clipboard_monitor_channel";
    private static final int NOTIFICATION_ID = 1002;

    private ClipboardManager clipboardManager;
    private ClipboardManager.OnPrimaryClipChangedListener clipListener;
    private String lastClipText = "";

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        clipboardManager = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
        clipListener = () -> {
            ClipData clipData = clipboardManager.getPrimaryClip();
            if (clipData != null && clipData.getItemCount() > 0) {
                CharSequence text = clipData.getItemAt(0).getText();
                if (text != null) {
                    String clipText = text.toString().trim();
                    if (!clipText.isEmpty() && !clipText.equals(lastClipText)) {
                        lastClipText = clipText;
                        triggerOverlay(clipText);
                    }
                }
            }
        };
        clipboardManager.addPrimaryClipChangedListener(clipListener);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        startForeground(NOTIFICATION_ID, buildNotification());
        return START_STICKY;
    }

    private void triggerOverlay(String text) {
        Intent overlayIntent = new Intent(this, OverlayService.class);
        overlayIntent.putExtra("text", text);
        overlayIntent.setAction(OverlayService.ACTION_SHOW);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(overlayIntent);
        } else {
            startService(overlayIntent);
        }
    }

    private Notification buildNotification() {
        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("OverlayLang")
                .setContentText("Monitoring clipboard for translations")
                .setSmallIcon(android.R.drawable.ic_menu_search)
                .setOngoing(true)
                .setPriority(NotificationCompat.PRIORITY_MIN)
                .build();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID, "Clipboard Monitor", NotificationManager.IMPORTANCE_MIN);
            channel.setDescription("Monitors clipboard for translation triggers");
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) manager.createNotificationChannel(channel);
        }
    }

    @Override
    public IBinder onBind(Intent intent) { return null; }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (clipboardManager != null && clipListener != null) {
            clipboardManager.removePrimaryClipChangedListener(clipListener);
        }
    }
}
