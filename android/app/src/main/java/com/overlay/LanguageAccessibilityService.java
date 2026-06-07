package com.overlay;

import android.accessibilityservice.AccessibilityService;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class LanguageAccessibilityService extends AccessibilityService {
    private static final int DAILY_LIMIT = 500;
    private static final long DOUBLE_TAP_MS = 400;
    private static final String PREFS = "overlay_prefs";

    private String lastSelectedText = "";
    private String lastTappedNodeId = "";
    private long lastTapTime = 0;

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        int type = event.getEventType();
        if (type == AccessibilityEvent.TYPE_VIEW_CLICKED) {
            handleClick(event);
        } else if (type == AccessibilityEvent.TYPE_VIEW_TEXT_SELECTION_CHANGED) {
            handleSelection(event);
        }
    }

    private void handleClick(AccessibilityEvent event) {
        AccessibilityNodeInfo node = event.getSource();
        if (node == null) return;
        CharSequence nodeText = node.getText();
        if (nodeText == null || nodeText.length() == 0) { node.recycle(); return; }

        String nodeId = nodeText.toString().hashCode() + "_" + event.getClassName();
        long now = System.currentTimeMillis();

        if (nodeId.equals(lastTappedNodeId) && (now - lastTapTime) <= DOUBLE_TAP_MS) {
            String text = extractWordAtCursor(node, nodeText.toString());
            if (!text.isEmpty()) triggerOverlay(text);
            lastTappedNodeId = "";
            lastTapTime = 0;
        } else {
            lastTappedNodeId = nodeId;
            lastTapTime = now;
        }
        node.recycle();
    }

    private String extractWordAtCursor(AccessibilityNodeInfo node, String fullText) {
        int cursor = node.getTextSelectionStart();
        if (cursor < 0 || cursor >= fullText.length()) {
            String[] words = fullText.trim().split("\\s+");
            return words.length > 0 ? words[0] : fullText.trim();
        }
        int start = cursor, end = cursor;
        while (start > 0 && !Character.isWhitespace(fullText.charAt(start - 1))) start--;
        while (end < fullText.length() && !Character.isWhitespace(fullText.charAt(end))) end++;
        return fullText.substring(start, end).trim();
    }

    private void handleSelection(AccessibilityEvent event) {
        CharSequence text = event.getText().isEmpty() ? null : event.getText().get(0);
        if (text == null) return;
        int start = event.getFromIndex(), end = event.getToIndex();
        if (start >= 0 && end > start && end <= text.length()) {
            String selected = text.subSequence(start, end).toString().trim();
            if (!selected.isEmpty() && !selected.equals(lastSelectedText)) {
                lastSelectedText = selected;
                triggerOverlay(selected);
            }
        }
    }

    private void triggerOverlay(String text) {
        SharedPreferences prefs = getSharedPreferences(PREFS, MODE_PRIVATE);
        String key = "daily_" + new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
        int count = prefs.getInt(key, 0);
        if (count >= DAILY_LIMIT) return;
        prefs.edit().putInt(key, count + 1).apply();
        Intent intent = new Intent(this, OverlayService.class);
        intent.putExtra("text", text);
        intent.setAction(OverlayService.ACTION_SHOW);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) startForegroundService(intent);
        else startService(intent);
    }

    @Override
    public void onInterrupt() {}
}
