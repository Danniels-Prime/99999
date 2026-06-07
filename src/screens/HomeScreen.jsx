import React, {useState, useEffect, useCallback} from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, NativeModules, AppState,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PermissionWizard from '../components/PermissionWizard';
import OverlayCard from '../components/OverlayCard';
import {translate} from '../services/translation';

const {OverlayModule} = NativeModules;

export default function HomeScreen() {
  const [setupDone, setSetupDone] = useState(false);
  const [serviceRunning, setServiceRunning] = useState(false);
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState(null);

  const checkSetup = useCallback(async () => {
    try {
      const overlay = await OverlayModule.hasOverlayPermission();
      const accessibility = await OverlayModule.isAccessibilityServiceEnabled();
      setSetupDone(overlay && accessibility);
    } catch {
      setSetupDone(false);
    }
  }, []);

  useEffect(() => {
    checkSetup();
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') checkSetup();
    });
    return () => sub.remove();
  }, [checkSetup]);

  const toggleService = async () => {
    try {
      if (serviceRunning) {
        await OverlayModule.stopOverlayService();
        setServiceRunning(false);
      } else {
        await OverlayModule.startOverlayService();
        setServiceRunning(true);
      }
    } catch {}
  };

  const handleTranslate = async () => {
    if (!inputText.trim()) return;
    const res = translate(inputText.trim());
    setResult(res);
    try {
      const data = await AsyncStorage.getItem('translation_history');
      const history = data ? JSON.parse(data) : [];
      history.unshift({...res, timestamp: Date.now()});
      await AsyncStorage.setItem('translation_history', JSON.stringify(history.slice(0, 200)));
    } catch {}
  };

  if (!setupDone) {
    return (
      <ScrollView style={styles.scroll}>
        <PermissionWizard onComplete={() => setSetupDone(true)} />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.headline}>OverlayLang</Text>
      <Text style={styles.sub}>EN ↔ ES overlay translator</Text>

      <TouchableOpacity
        style={[styles.toggleBtn, serviceRunning ? styles.btnStop : styles.btnStart]}
        onPress={toggleService}>
        <Text style={styles.toggleBtnText}>
          {serviceRunning ? 'Stop Monitoring' : 'Start Monitoring'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.sectionLabel}>Quick Translate</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter English word or phrase..."
        placeholderTextColor="#555"
        value={inputText}
        onChangeText={setInputText}
        onSubmitEditing={handleTranslate}
      />
      <TouchableOpacity style={styles.translateBtn} onPress={handleTranslate}>
        <Text style={styles.translateBtnText}>Translate</Text>
      </TouchableOpacity>

      {result && (
        <OverlayCard
          sourceText={result.source}
          translation={result.translation}
          phonetic={result.phonetic}
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
  toggleBtn: {borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 32},
  btnStart: {backgroundColor: '#6c63ff'},
  btnStop: {backgroundColor: '#e74c3c'},
  toggleBtnText: {color: '#fff', fontSize: 16, fontWeight: '600'},
  sectionLabel: {color: '#aaa', fontSize: 13, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1},
  input: {backgroundColor: '#1e1e2e', borderRadius: 10, padding: 14, color: '#fff', fontSize: 16, marginBottom: 12},
  translateBtn: {backgroundColor: '#6c63ff', borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 8},
  translateBtnText: {color: '#fff', fontSize: 16, fontWeight: '600'},
});
