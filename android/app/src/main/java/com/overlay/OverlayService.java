package com.overlay;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.PixelFormat;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.provider.Settings;
import android.speech.tts.TextToSpeech;
import android.view.Gravity;
import android.view.WindowManager;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;
import androidx.core.app.NotificationCompat;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

public class OverlayService extends Service {
    public static final String ACTION_SHOW = "com.overlay.SHOW_OVERLAY";
    public static final String ACTION_HIDE = "com.overlay.HIDE_OVERLAY";
    public static final String EXTRA_WORD = "word";
    public static final String EXTRA_MODE = "mode";
    public static final String MODE_SENTENCE = "sentence";
    public static final String MODE_CLIPBOARD = "clipboard";
    private static final String CHANNEL_ID = "overlay_service_channel";
    private static final int NOTIFICATION_ID = 1003;
    private static final long AUTO_DISMISS_MS = 8000;
    private static final int DAILY_LIMIT = 500;
    private static final String PREFS = "overlay_prefs";

    private static final Map<String, String> QUICK_DICT = new HashMap<>();
    static {
        QUICK_DICT.put("hello","hola"); QUICK_DICT.put("goodbye","adiós");
        QUICK_DICT.put("yes","sí"); QUICK_DICT.put("no","no");
        QUICK_DICT.put("please","por favor"); QUICK_DICT.put("thanks","gracias");
        QUICK_DICT.put("thank","gracias"); QUICK_DICT.put("sorry","lo siento");
        QUICK_DICT.put("good","bueno"); QUICK_DICT.put("bad","malo");
        QUICK_DICT.put("water","agua"); QUICK_DICT.put("food","comida");
        QUICK_DICT.put("house","casa"); QUICK_DICT.put("dog","perro");
        QUICK_DICT.put("cat","gato"); QUICK_DICT.put("car","coche");
        QUICK_DICT.put("book","libro"); QUICK_DICT.put("money","dinero");
        QUICK_DICT.put("time","tiempo"); QUICK_DICT.put("day","día");
        QUICK_DICT.put("night","noche"); QUICK_DICT.put("love","amor");
        QUICK_DICT.put("friend","amigo"); QUICK_DICT.put("family","familia");
        QUICK_DICT.put("work","trabajo"); QUICK_DICT.put("school","escuela");
        QUICK_DICT.put("red","rojo"); QUICK_DICT.put("blue","azul");
        QUICK_DICT.put("green","verde"); QUICK_DICT.put("white","blanco");
        QUICK_DICT.put("black","negro"); QUICK_DICT.put("happy","feliz");
        QUICK_DICT.put("sad","triste"); QUICK_DICT.put("big","grande");
        QUICK_DICT.put("small","pequeño"); QUICK_DICT.put("fast","rápido");
        QUICK_DICT.put("slow","lento"); QUICK_DICT.put("hot","caliente");
        QUICK_DICT.put("cold","frío"); QUICK_DICT.put("man","hombre");
        QUICK_DICT.put("woman","mujer"); QUICK_DICT.put("world","mundo");
        QUICK_DICT.put("life","vida"); QUICK_DICT.put("city","ciudad");
        QUICK_DICT.put("beautiful","hermoso"); QUICK_DICT.put("sun","sol");
        QUICK_DICT.put("moon","luna"); QUICK_DICT.put("music","música");
    }

    private WindowManager windowManager;
    private android.view.View overlayView;
    private Handler handler = new Handler(Looper.getMainLooper());
    private Runnable autoDismissRunnable;
    private TextToSpeech tts;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
        tts = new TextToSpeech(this, status -> {
            if (status == TextToSpeech.SUCCESS) tts.setLanguage(new Locale("es", "ES"));
        });
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        startForeground(NOTIFICATION_ID, buildNotification());
        if (intent != null && ACTION_SHOW.equals(intent.getAction())) {
            String text = intent.getStringExtra("text");
            if (text == null) text = intent.getStringExtra(EXTRA_WORD);
            if (text != null && !text.isEmpty()) showOverlay(text.trim());
        } else if (intent != null && ACTION_HIDE.equals(intent.getAction())) {
            hideOverlay();
        }
        return START_NOT_STICKY;
    }

    private void showOverlay(String sourceText) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
                && !Settings.canDrawOverlays(this)) return;
        hideOverlay();

        String lower = sourceText.toLowerCase().trim();
        String translation = QUICK_DICT.containsKey(lower) ? QUICK_DICT.get(lower) : sourceText;
        boolean translated = !translation.equals(sourceText);

        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setBackgroundColor(0xF0222233);
        layout.setPadding(40, 28, 40, 28);

        TextView srcView = new TextView(this);
        srcView.setText(sourceText);
        srcView.setTextColor(0xFFAAAAAA);
        srcView.setTextSize(13f);

        TextView trlView = new TextView(this);
        trlView.setText(translation);
        trlView.setTextColor(0xFFFFFFFF);
        trlView.setTextSize(20f);
        trlView.setPadding(0, 10, 0, 0);

        layout.addView(srcView);
        layout.addView(trlView);
        layout.setOnClickListener(v -> hideOverlay());

        int type = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                : WindowManager.LayoutParams.TYPE_PHONE;
        WindowManager.LayoutParams params = new WindowManager.LayoutParams(
                WindowManager.LayoutParams.WRAP_CONTENT,
                WindowManager.LayoutParams.WRAP_CONTENT,
                type, WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
                PixelFormat.TRANSLUCENT);
        params.gravity = Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL;
        params.y = 200;
        overlayView = layout;
        windowManager.addView(overlayView, params);

        if (translated) {
            tts.setLanguage(new Locale("es", "ES"));
            tts.speak(translation, TextToSpeech.QUEUE_FLUSH, null, "overlay_tts");
        }

        if (autoDismissRunnable != null) handler.removeCallbacks(autoDismissRunnable);
        autoDismissRunnable = this::hideOverlay;
        handler.postDelayed(autoDismissRunnable, AUTO_DISMISS_MS);
    }

    private void hideOverlay() {
        if (overlayView != null) {
            try { windowManager.removeView(overlayView); } catch (Exception ignored) {}
            overlayView = null;
        }
        if (autoDismissRunnable != null) {
            handler.removeCallbacks(autoDismissRunnable);
            autoDismissRunnable = null;
        }
    }

    private Notification buildNotification() {
        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("OverlayLang").setContentText("Overlay active")
                .setSmallIcon(android.R.drawable.ic_menu_search)
                .setOngoing(true).setPriority(NotificationCompat.PRIORITY_MIN).build();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel ch = new NotificationChannel(
                    CHANNEL_ID, "Overlay Service", NotificationManager.IMPORTANCE_MIN);
            NotificationManager mgr = getSystemService(NotificationManager.class);
            if (mgr != null) mgr.createNotificationChannel(ch);
        }
    }

    @Override
    public IBinder onBind(Intent intent) { return null; }

    @Override
    public void onDestroy() {
        super.onDestroy();
        hideOverlay();
        if (tts != null) { tts.stop(); tts.shutdown(); }
    }
}
