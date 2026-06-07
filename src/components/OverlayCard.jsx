import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';

export default function OverlayCard({sourceText, translation, phonetic, onDismiss}) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.sourceText}>{sourceText}</Text>
        <TouchableOpacity onPress={onDismiss} style={styles.closeBtn}>
          <Text style={styles.closeText}>×</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.translation}>{translation}</Text>
      {phonetic ? <Text style={styles.phonetic}>[{phonetic}]</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1e1e2e',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    elevation: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#6c63ff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sourceText: {color: '#aaa', fontSize: 14, flex: 1},
  closeBtn: {padding: 4},
  closeText: {color: '#888', fontSize: 22, lineHeight: 22},
  translation: {color: '#fff', fontSize: 22, fontWeight: 'bold'},
  phonetic: {color: '#6c63ff', fontSize: 14, marginTop: 6, fontStyle: 'italic'},
});
