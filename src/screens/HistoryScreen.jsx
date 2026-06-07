import React, {useState, useEffect} from 'react';
import {View, FlatList, Text, TouchableOpacity, StyleSheet} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HistoryScreen() {
  const [history, setHistory] = useState([]);

  const loadHistory = async () => {
    try {
      const data = await AsyncStorage.getItem('translation_history');
      if (data) setHistory(JSON.parse(data));
    } catch {}
  };

  const clearHistory = async () => {
    await AsyncStorage.removeItem('translation_history');
    setHistory([]);
  };

  useEffect(() => { loadHistory(); }, []);

  if (history.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No translations yet.</Text>
        <Text style={styles.emptyHint}>Copy or select text to translate.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.clearBtn} onPress={clearHistory}>
        <Text style={styles.clearText}>Clear History</Text>
      </TouchableOpacity>
      <FlatList
        data={history}
        keyExtractor={(_, i) => String(i)}
        renderItem={({item}) => (
          <View style={styles.item}>
            <Text style={styles.source}>{item.source}</Text>
            <Text style={styles.translation}>{item.translation}</Text>
            {item.phonetic ? <Text style={styles.phonetic}>[{item.phonetic}]</Text> : null}
            <Text style={styles.time}>{new Date(item.timestamp).toLocaleString()}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#0f0f1a'},
  empty: {flex: 1, backgroundColor: '#0f0f1a', alignItems: 'center', justifyContent: 'center'},
  emptyText: {color: '#fff', fontSize: 18, marginBottom: 8},
  emptyHint: {color: '#888', fontSize: 14},
  clearBtn: {alignItems: 'flex-end', padding: 16},
  clearText: {color: '#e74c3c', fontSize: 14},
  item: {backgroundColor: '#1e1e2e', margin: 8, borderRadius: 12, padding: 16, borderLeftWidth: 3, borderLeftColor: '#6c63ff'},
  source: {color: '#aaa', fontSize: 13, marginBottom: 4},
  translation: {color: '#fff', fontSize: 18, fontWeight: 'bold'},
  phonetic: {color: '#6c63ff', fontSize: 13, fontStyle: 'italic', marginTop: 4},
  time: {color: '#555', fontSize: 11, marginTop: 8},
});
