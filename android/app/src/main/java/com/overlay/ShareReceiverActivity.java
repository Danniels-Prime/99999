package com.overlay;

import android.app.Activity;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;

public class ShareReceiverActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Intent intent = getIntent();
        if (Intent.ACTION_SEND.equals(intent.getAction())
                && "text/plain".equals(intent.getType())) {
            String sharedText = intent.getStringExtra(Intent.EXTRA_TEXT);
            if (sharedText != null && !sharedText.trim().isEmpty()) {
                Intent overlayIntent = new Intent(this, OverlayService.class);
                overlayIntent.setAction(OverlayService.ACTION_SHOW);
                overlayIntent.putExtra("text", sharedText.trim());
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    startForegroundService(overlayIntent);
                } else {
                    startService(overlayIntent);
                }
            }
        }
        finish();
    }
}
