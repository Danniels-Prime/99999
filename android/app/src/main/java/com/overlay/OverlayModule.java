package com.overlay;

import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.speech.tts.TextToSpeech;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class OverlayModule extends ReactContextBaseJavaModule {
    private static final int DAILY_LIMIT = 500;
    private static final String PREFS = "overlay_prefs";
    private TextToSpeech tts;

    public OverlayModule(ReactApplicationContext context) {
        super(context);
        tts = new TextToSpeech(context, status -> {
            if (status == TextToSpeech.SUCCESS) tts.setLanguage(new Locale("es", "ES"));
        });
    }

    @Override
    public String getName() { return "OverlayModule"; }

    @ReactMethod
    public void speak(String text, String lang, Promise promise) {
        try {
            Locale locale = "es".equals(lang) ? new Locale("es", "ES") : Locale.ENGLISH;
            tts.setLanguage(locale);
            int result = tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "utterance");
            promise.resolve(result == TextToSpeech.SUCCESS);
        } catch (Exception e) { promise.reject("TTS_ERROR", e.getMessage()); }
    }

    @ReactMethod
    public void stopSpeaking(Promise promise) {
        try { tts.stop(); promise.resolve(true); }
        catch (Exception e) { promise.reject("TTS_ERROR", e.getMessage()); }
    }

    private String todayKey() {
        return "daily_" + new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
    }

    @ReactMethod
    public void getDailyCount(Promise promise) {
        promise.resolve(getReactApplicationContext()
            .getSharedPreferences(PREFS, 0).getInt(todayKey(), 0));
    }

    @ReactMethod
    public void incrementDailyCount(Promise promise) {
        SharedPreferences prefs = getReactApplicationContext().getSharedPreferences(PREFS, 0);
        String key = todayKey();
        int count = prefs.getInt(key, 0);
        if (count >= DAILY_LIMIT) { promise.resolve(-1); return; }
        prefs.edit().putInt(key, count + 1).apply();
        promise.resolve(count + 1);
    }

    @ReactMethod
    public void resetDailyCount(Promise promise) {
        getReactApplicationContext().getSharedPreferences(PREFS, 0)
            .edit().putInt(todayKey(), 0).apply();
        promise.resolve(true);
    }

    @ReactMethod
    public void getSystemLanguage(Promise promise) {
        promise.resolve(Locale.getDefault().getLanguage());
    }

    @ReactMethod
    public void hasOverlayPermission(Promise promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M)
            promise.resolve(Settings.canDrawOverlays(getReactApplicationContext()));
        else promise.resolve(true);
    }

    @ReactMethod
    public void requestOverlayPermission(Promise promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
                && !Settings.canDrawOverlays(getReactApplicationContext())) {
            Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:" + getReactApplicationContext().getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getReactApplicationContext().startActivity(intent);
            promise.resolve(false);
        } else { promise.resolve(true); }
    }

    @ReactMethod
    public void startOverlayService(Promise promise) {
        try {
            Intent intent = new Intent(getReactApplicationContext(), ClipboardMonitorService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                getReactApplicationContext().startForegroundService(intent);
            else getReactApplicationContext().startService(intent);
            promise.resolve(true);
        } catch (Exception e) { promise.reject("START_FAILED", e.getMessage()); }
    }

    @ReactMethod
    public void stopOverlayService(Promise promise) {
        try {
            getReactApplicationContext().stopService(
                new Intent(getReactApplicationContext(), ClipboardMonitorService.class));
            getReactApplicationContext().stopService(
                new Intent(getReactApplicationContext(), OverlayService.class));
            promise.resolve(true);
        } catch (Exception e) { promise.reject("STOP_FAILED", e.getMessage()); }
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
            Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES);
        String serviceName = getReactApplicationContext().getPackageName() + "/.LanguageAccessibilityService";
        promise.resolve(prefString != null && prefString.contains(serviceName));
    }
}
