package com.overlay;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class OverlayModule extends ReactContextBaseJavaModule {
    public OverlayModule(ReactApplicationContext context) { super(context); }

    @Override
    public String getName() { return "OverlayModule"; }

    @ReactMethod
    public void hasOverlayPermission(Promise promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            promise.resolve(Settings.canDrawOverlays(getReactApplicationContext()));
        } else {
            promise.resolve(true);
        }
    }

    @ReactMethod
    public void requestOverlayPermission(Promise promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
                && !Settings.canDrawOverlays(getReactApplicationContext())) {
            Intent intent = new Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:" + getReactApplicationContext().getPackageName())
            );
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getReactApplicationContext().startActivity(intent);
            promise.resolve(false);
        } else {
            promise.resolve(true);
        }
    }

    @ReactMethod
    public void startOverlayService(Promise promise) {
        try {
            Intent intent = new Intent(getReactApplicationContext(), ClipboardMonitorService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                getReactApplicationContext().startForegroundService(intent);
            } else {
                getReactApplicationContext().startService(intent);
            }
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("START_FAILED", e.getMessage());
        }
    }

    @ReactMethod
    public void stopOverlayService(Promise promise) {
        try {
            getReactApplicationContext().stopService(
                new Intent(getReactApplicationContext(), ClipboardMonitorService.class));
            getReactApplicationContext().stopService(
                new Intent(getReactApplicationContext(), OverlayService.class));
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("STOP_FAILED", e.getMessage());
        }
    }

    @ReactMethod
    public void openAccessibilitySettings(Promise promise) {
        Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getReactApplicationContext().startActivity(intent);
        promise.resolve(true);
    }

    @ReactMethod
    public void isAccessibilityServiceEnabled(Promise promise) {
        String prefString = Settings.Secure.getString(
            getReactApplicationContext().getContentResolver(),
            Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        );
        String serviceName = getReactApplicationContext().getPackageName()
            + "/.LanguageAccessibilityService";
        promise.resolve(prefString != null && prefString.contains(serviceName));
    }
}
