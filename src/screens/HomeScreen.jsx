import React, {useState, useEffect, useCallback} from 'react';
import {View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, NativeModules, AppState} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PermissionWizard from '../components/PermissionWizard';
import OverlayCard from '../components/OverlayCard';
import {translate} from '../services/translation';

const {OverlayModule} = NativeModules;
const DAILY_LIMIT = 500;

export default function HomeScreen() {
  const [setupDone, setSetupDone] = useState(false);
  const [serviceRunning, setServiceRunning] = useState(false);
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState(null);
  const [dailyCount, setDailyCount] = useState(0);
  const [systemLang, setSystemLang] = useState('en');
  const [showPhonetics, setShowPhonetics] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [overlay, accessibility, count, lang, settingsRaw] = await Promise.all([
        OverlayModule.hasOverlayPermission(),
        OverlayModule.isAccessibilityServiceEnabled(),
        OverlayModule.getDailyCount(),
        OverlayModule.getSystemLanguage(),
        AsyncStorage.getItem('app_settings'),
      ]);
      setSetupDone(overlay && accessibility);
      setDailyCount(count);
      setSystemLang(lang);
      if (settingsRaw) {
        const s = JSON.parse(settingsRaw);
        if (typeof s.showPhonetics === 'boolean') setShowPhonetics(s.showPhonetics);
      }
    } catch {}
  }, []);

  useEffect(() => {
    refresh();
    const sub = AppState.addEventListener('change', state => { if (state === 'active') refresh(); });
    return () => sub.remove();
  }, [refresh]);

  const toggleService = async () => {
    try {
      if (serviceRunning) { await OverlayModule.stopOverlayService(); setServiceRunning(false); }
      else { await OverlayModule.startOverlayService(); setServiceRunning(true); }
    } catch {}
  };

  const handleTranslate = async () => {
    if (!inputText.trim()) return;
    const newCount = await OverlayModule.incrementDailyCount();
    if (newCount === -1) return;
    setDailyCount(newCount);
    const res = translate(inputText.trim(), 'auto', systemLang, showPhonetics);
    setResult(res);
    try {
      const data = await AsyncStorage.getItem('translation_history');
      const history = data ? JSON.parse(data) : [];
      history.unshift({...res, timestamp: Date.now()});
      await AsyncStorage.setItem('translation_history', JSON.stringify(history.slice(0, 200)));
    } catch {}
  };

  if (!setupDone) {
    return <ScrollView style={styles.scroll}><PermissionWizard onComplete={() => setSetupDone(true)} /></ScrollView>;
  }

  const limitReached = dailyCount >= DAILY_LIMIT;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.headline}>OverlayLang</Text>
      <Text style={styles.sub}>EN ↔ ES overlay translator</Text>
      <TouchableOpacity style={[styles.toggleBtn, serviceRunning ? styles.btnStop : styles.btnStart]} onPress={toggleService}>
        <Text style={styles.toggleBtnText}>{serviceRunning ? 'Stop Monitoring' : 'Start Monitoring'}</Text>
      </TouchableOpacity>
      <View style={styles.counterRow}>
        <Text style={[styles.counterText, limitReached && styles.counterLimit]}>{dailyCount} / {DAILY_LIMIT} today</Text>
        {limitReached && <Text style={styles.limitBadge}>Limit reached</Text>}
      </View>
      <Text style={styles.sectionLabel}>Quick Translate</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter word or phrase..."
        placeholderTextColor="#555"
        value={inputText}
        onChangeText={setInputText}
        onSubmitEditing={handleTranslate}
        editable={!limitReached}
      />
      <TouchableOpacity style={[styles.translateBtn, limitReached && styles.translateBtnDisabled]} onPress={handleTranslate} disabled={limitReached}>
        <Text style={styles.translateBtnText}>Translate</Text>
      </TouchableOpacity>
      {result && (
        <OverlayCard
          sourceText={result.source}
          translation={result.translation}
          phonetic={result.phonetic}
          example={result.example}
          similar={result.similar}
          ttsText={result.ttsText}
          ttsLang={result.ttsLang}
          showPhonetics={result.showPhonetic}
          systemLang={systemLang}
          autoPlay={true}
          onDismiss={() => setResult(null)}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {flex: 1, backgroundColor: '#0f0f1a'},
  content: {padding: 20, paddingBottom: 60},
  headline: {color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 4},
  sub: {color: '#888', fontSize: 14, marginBottom: 32},
  toggleBtn: {borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 12},
  btnStart: {backgroundColor: '#6c63ff'},
  btnStop: {backgroundColor: '#e74c3c'},
  toggleBtnText: {color: '#fff', fontSize: 16, fontWeight: '600'},
  counterRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 12},
  counterText: {color: '#888', fontSize: 13},
  counterLimit: {color: '#e74c3c'},
  limitBadge: {backgroundColor: '#3a1010', color: '#e74c3c', fontSize: 11, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6},
  sectionLabel: {color: '#aaa', fontSize: 13, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1},
  input: {backgroundColor: '#1e1e2e', borderRadius: 10, padding: 14, color: '#fff', fontSize: 16, marginBottom: 12},
  translateBtn: {backgroundColor: '#6c63ff', borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 8},
  translateBtnDisabled: {backgroundColor: '#333'},
  translateBtnText: {color: '#fff', fontSize: 16, fontWeight: '600'},
});
