import React, {useState, useEffect} from 'react';
import {View, Text, Switch, TouchableOpacity, StyleSheet, NativeModules, Alert} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const {OverlayModule} = NativeModules;
const SETTINGS_KEY = 'app_settings';
const defaults = {clipboardMonitor: true, accessibilityMonitor: true, startOnBoot: true, showPhonetics: true};

export default function SettingsScreen() {
  const [settings, setSettings] = useState(defaults);
  const [dailyCount, setDailyCount] = useState(0);

  useEffect(() => {
    AsyncStorage.getItem(SETTINGS_KEY).then(data => {
      if (data) setSettings({...defaults, ...JSON.parse(data)});
    });
    OverlayModule.getDailyCount().then(setDailyCount).catch(() => {});
  }, []);

  const save = async updated => {
    setSettings(updated);
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  };

  const toggle = key => () => save({...settings, [key]: !settings[key]});

  const resetCount = () => Alert.alert(
    'Reset daily count?', "Resets today's translation count to 0.",
    [{text: 'Cancel', style: 'cancel'},
     {text: 'Reset', style: 'destructive', onPress: async () => {
       await OverlayModule.resetDailyCount(); setDailyCount(0);
     }}]
  );

  return (
    <View style={styles.container}>
      <Text style={styles.section}>Detection</Text>
      <View style={styles.row}>
        <View style={styles.rowText}><Text style={styles.label}>Clipboard Monitor</Text><Text style={styles.hint}>Translate text you copy</Text></View>
        <Switch value={settings.clipboardMonitor} onValueChange={toggle('clipboardMonitor')} thumbColor={settings.clipboardMonitor ? '#6c63ff' : '#555'} trackColor={{false:'#333',true:'#3d3880'}} />
      </View>
      <View style={styles.row}>
        <View style={styles.rowText}><Text style={styles.label}>Accessibility Monitor</Text><Text style={styles.hint}>Double-tap or select text to translate</Text></View>
        <Switch value={settings.accessibilityMonitor} onValueChange={toggle('accessibilityMonitor')} thumbColor={settings.accessibilityMonitor ? '#6c63ff' : '#555'} trackColor={{false:'#333',true:'#3d3880'}} />
      </View>

      <Text style={styles.section}>Translation</Text>
      <View style={styles.row}>
        <View style={styles.rowText}><Text style={styles.label}>Phonetics (English only)</Text><Text style={styles.hint}>Show pronunciation when source is English</Text></View>
        <Switch value={settings.showPhonetics} onValueChange={toggle('showPhonetics')} thumbColor={settings.showPhonetics ? '#6c63ff' : '#555'} trackColor={{false:'#333',true:'#3d3880'}} />
      </View>

      <Text style={styles.section}>Daily Limit</Text>
      <View style={styles.countBox}>
        <Text style={styles.countLabel}>Today's activations</Text>
        <Text style={styles.countValue}>{dailyCount} / 500</Text>
      </View>
      <TouchableOpacity style={styles.resetBtn} onPress={resetCount}>
        <Text style={styles.resetBtnText}>Reset Today's Count</Text>
      </TouchableOpacity>

      <Text style={styles.section}>System</Text>
      <View style={styles.row}>
        <View style={styles.rowText}><Text style={styles.label}>Start on Boot</Text><Text style={styles.hint}>Auto-start monitoring after reboot</Text></View>
        <Switch value={settings.startOnBoot} onValueChange={toggle('startOnBoot')} thumbColor={settings.startOnBoot ? '#6c63ff' : '#555'} trackColor={{false:'#333',true:'#3d3880'}} />
      </View>

      <Text style={styles.section}>Permissions</Text>
      <TouchableOpacity style={styles.permBtn} onPress={() => OverlayModule.requestOverlayPermission()}>
        <Text style={styles.permBtnText}>Overlay Permission</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.permBtn} onPress={() => OverlayModule.openAccessibilitySettings()}>
        <Text style={styles.permBtnText}>Accessibility Service</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#0f0f1a', padding: 20},
  section: {color: '#6c63ff', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 24, marginBottom: 12},
  row: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e1e2e', borderRadius: 12, padding: 16, marginBottom: 8},
  rowText: {flex: 1, marginRight: 12},
  label: {color: '#fff', fontSize: 15},
  hint: {color: '#777', fontSize: 12, marginTop: 2},
  countBox: {backgroundColor: '#1e1e2e', borderRadius: 12, padding: 16, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between'},
  countLabel: {color: '#aaa', fontSize: 15},
  countValue: {color: '#fff', fontSize: 15, fontWeight: '700'},
  resetBtn: {backgroundColor: '#1e1e2e', borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 8, borderWidth: 1, borderColor: '#e74c3c'},
  resetBtnText: {color: '#e74c3c', fontSize: 14, fontWeight: '600'},
  permBtn: {backgroundColor: '#1e1e2e', borderRadius: 12, padding: 16, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: '#6c63ff'},
  permBtnText: {color: '#fff', fontSize: 15},
});
