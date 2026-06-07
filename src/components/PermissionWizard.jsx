import React, {useState, useEffect} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, NativeModules} from 'react-native';

const {OverlayModule} = NativeModules;

const STEPS = [
  {
    id: 'overlay',
    title: 'Display Over Other Apps',
    description: 'Required to show translation bubbles on top of any app.',
    check: () => OverlayModule.hasOverlayPermission(),
    action: () => OverlayModule.requestOverlayPermission(),
  },
  {
    id: 'accessibility',
    title: 'Accessibility Service',
    description: 'Detects selected text so translations appear automatically.',
    check: () => OverlayModule.isAccessibilityServiceEnabled(),
    action: () => OverlayModule.openAccessibilitySettings(),
  },
];

export default function PermissionWizard({onComplete}) {
  const [statuses, setStatuses] = useState({});

  const checkAll = async () => {
    const results = {};
    for (const step of STEPS) {
      try { results[step.id] = await step.check(); }
      catch { results[step.id] = false; }
    }
    setStatuses(results);
    if (Object.values(results).every(Boolean)) onComplete?.();
  };

  useEffect(() => {
    checkAll();
    const interval = setInterval(checkAll, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Setup Required</Text>
      {STEPS.map(step => (
        <View key={step.id} style={styles.step}>
          <View style={styles.stepHeader}>
            <View style={[styles.dot, statuses[step.id] ? styles.dotDone : styles.dotPending]} />
            <Text style={styles.stepTitle}>{step.title}</Text>
          </View>
          <Text style={styles.stepDesc}>{step.description}</Text>
          {!statuses[step.id] && (
            <TouchableOpacity style={styles.btn} onPress={() => step.action().then(checkAll)}>
              <Text style={styles.btnText}>Grant Permission</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {padding: 20},
  title: {color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 24},
  step: {backgroundColor: '#1e1e2e', borderRadius: 12, padding: 16, marginBottom: 16},
  stepHeader: {flexDirection: 'row', alignItems: 'center', marginBottom: 8},
  dot: {width: 12, height: 12, borderRadius: 6, marginRight: 10},
  dotDone: {backgroundColor: '#4caf50'},
  dotPending: {backgroundColor: '#ff9800'},
  stepTitle: {color: '#fff', fontSize: 16, fontWeight: '600'},
  stepDesc: {color: '#aaa', fontSize: 14, lineHeight: 20},
  btn: {backgroundColor: '#6c63ff', borderRadius: 8, padding: 10, marginTop: 12, alignItems: 'center'},
  btnText: {color: '#fff', fontWeight: '600'},
});
