package com.overlay;

import android.accessibilityservice.AccessibilityService;
import android.content.Intent;
import android.os.Build;
import android.view.accessibility.AccessibilityEvent;

public class LanguageAccessibilityService extends AccessibilityService {
    private String lastSelectedText = "";

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event.getEventType() != AccessibilityEvent.TYPE_VIEW_TEXT_SELECTION_CHANGED) return;

        CharSequence text = event.getText().isEmpty() ? null : event.getText().get(0);
        if (text == null) return;

        int start = event.getFromIndex();
        int end = event.getToIndex();

        if (start >= 0 && end > start && end <= text.length()) {
            String selected = text.subSequence(start, end).toString().trim();
            if (!selected.isEmpty() && !selected.equals(lastSelectedText)
                    && selected.split("\\s+").length <= 5) {
                lastSelectedText = selected;
                triggerOverlay(selected);
            }
        }
    }

    private void triggerOverlay(String text) {
        Intent intent = new Intent(this, OverlayService.class);
        intent.putExtra("text", text);
        intent.setAction(OverlayService.ACTION_SHOW);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(intent);
        } else {
            startService(intent);
        }
    }

    @Override
    public void onInterrupt() {}
}
