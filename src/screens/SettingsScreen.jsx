import React, {useState, useEffect} from 'react';
import {View, Text, Switch, TouchableOpacity, StyleSheet, NativeModules} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const {OverlayModule} = NativeModules;
const SETTINGS_KEY = 'app_settings';
const defaults = {clipboardMonitor: true, accessibilityMonitor: true, startOnBoot: true};

export default function SettingsScreen() {
  const [settings, setSettings] = useState(defaults);

  useEffect(() => {
    AsyncStorage.getItem(SETTINGS_KEY).then(data => {
      if (data) setSettings({...defaults, ...JSON.parse(data)});
    });
  }, []);

  const save = async updated => {
    setSettings(updated);
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  };

  const toggle = key => () => save({...settings, [key]: !settings[key]});

  return (
    <View style={styles.container}>
      <Text style={styles.section}>Detection</Text>

      <View style={styles.row}>
        <View style={styles.rowText}>
          <Text style={styles.label}>Clipboard Monitor</Text>
          <Text style={styles.hint}>Translate text you copy</Text>
        </View>
        <Switch
          value={settings.clipboardMonitor}
          onValueChange={toggle('clipboardMonitor')}
          thumbColor={settings.clipboardMonitor ? '#6c63ff' : '#555'}
          trackColor={{false: '#333', true: '#3d3880'}}
        />
      </View>

      <View style={styles.row}>
        <View style={styles.rowText}>
          <Text style={styles.label}>Accessibility Monitor</Text>
          <Text style={styles.hint}>Translate text you select</Text>
        </View>
        <Switch
          value={settings.accessibilityMonitor}
          onValueChange={toggle('accessibilityMonitor')}
          thumbColor={settings.accessibilityMonitor ? '#6c63ff' : '#555'}
          trackColor={{false: '#333', true: '#3d3880'}}
        />
      </View>

      <Text style={styles.section}>System</Text>

      <View style={styles.row}>
        <View style={styles.rowText}>
          <Text style={styles.label}>Start on Boot</Text>
          <Text style={styles.hint}>Auto-start monitoring after reboot</Text>
        </View>
        <Switch
          value={settings.startOnBoot}
          onValueChange={toggle('startOnBoot')}
          thumbColor={settings.startOnBoot ? '#6c63ff' : '#555'}
          trackColor={{false: '#333', true: '#3d3880'}}
        />
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
  permBtn: {backgroundColor: '#1e1e2e', borderRadius: 12, padding: 16, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: '#6c63ff'},
  permBtnText: {color: '#fff', fontSize: 15},
});
