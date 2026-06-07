import React, {useEffect, useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, ScrollView, NativeModules} from 'react-native';
import {translate} from '../services/translation';

const {OverlayModule} = NativeModules;

function TappableWord({word, systemLang, showPhonetics}) {
  const [mini, setMini] = useState(null);
  const clean = word.replace(/[^a-zA-Zà-ÿ]/g, '');
  if (!clean) return <Text style={styles.exampleWord}>{word} </Text>;
  return (
    <View>
      <TouchableOpacity onPress={() => {
        const res = translate(clean, 'auto', systemLang, showPhonetics);
        setMini(res.found ? res : null);
      }}>
        <Text style={styles.exampleWord}>{word} </Text>
      </TouchableOpacity>
      {mini && (
        <View style={styles.miniCard}>
          <TouchableOpacity onPress={() => setMini(null)} style={styles.miniCloseRow}>
            <Text style={styles.miniClose}>×</Text>
          </TouchableOpacity>
          <Text style={styles.miniTranslation}>{mini.translation}</Text>
          {mini.showPhonetic && mini.phonetic ? (
            <Text style={styles.miniPhonetic}>[{mini.phonetic}]</Text>
          ) : null}
        </View>
      )}
    </View>
  );
}

export default function OverlayCard({
  sourceText, translation, phonetic, example, similar = [],
  ttsText, ttsLang, showPhonetics, systemLang, onDismiss, autoPlay = true,
}) {
  const [speaking, setSpeaking] = useState(false);
  const [showExample, setShowExample] = useState(false);

  const speak = async () => {
    try {
      setSpeaking(true);
      await OverlayModule.speak(ttsText || translation, ttsLang || 'es');
      setSpeaking(false);
    } catch { setSpeaking(false); }
  };

  const stop = async () => {
    try { await OverlayModule.stopSpeaking(); setSpeaking(false); } catch {}
  };

  useEffect(() => {
    if (autoPlay && translation) speak();
    return () => { OverlayModule.stopSpeaking?.().catch?.(() => {}); };
  }, [translation]);

  const exampleWords = example ? example.split(' ') : [];

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.sourceText}>{sourceText}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={speaking ? stop : speak} style={styles.ttsBtn}>
            <Text style={styles.ttsIcon}>{speaking ? '⏹' : '🔊'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onDismiss} style={styles.closeBtn}>
            <Text style={styles.closeText}>×</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.translation}>{translation}</Text>
      {showPhonetics && phonetic ? (
        <Text style={styles.phonetic}>[{phonetic}]</Text>
      ) : null}

      {example ? (
        <TouchableOpacity
          style={styles.examplesBtn}
          onPress={() => setShowExample(v => !v)}>
          <Text style={styles.examplesBtnText}>
            {showExample ? 'Hide example' : 'Show example'}
          </Text>
        </TouchableOpacity>
      ) : null}

      {showExample && example ? (
        <View style={styles.exampleBox}>
          <Text style={styles.exampleLabel}>Example</Text>
          <View style={styles.exampleWordRow}>
            {exampleWords.map((word, i) => (
              <TappableWord
                key={i}
                word={word}
                systemLang={systemLang}
                showPhonetics={showPhonetics}
              />
            ))}
          </View>
        </View>
      ) : null}

      {similar.length > 0 ? (
        <View style={styles.similarBox}>
          <Text style={styles.similarLabel}>Similar</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {similar.map((w, i) => (
              <View key={i} style={styles.chip}>
                <Text style={styles.chipEn}>{w.en}</Text>
                <Text style={styles.chipEs}>{w.es}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {backgroundColor: '#1e1e2e', borderRadius: 16, padding: 20, marginTop: 16, elevation: 8, borderLeftWidth: 4, borderLeftColor: '#6c63ff'},
  header: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8},
  sourceText: {color: '#aaa', fontSize: 14, flex: 1},
  headerActions: {flexDirection: 'row', alignItems: 'center'},
  ttsBtn: {padding: 4, marginRight: 8},
  ttsIcon: {fontSize: 18},
  closeBtn: {padding: 4},
  closeText: {color: '#888', fontSize: 22, lineHeight: 22},
  translation: {color: '#fff', fontSize: 26, fontWeight: 'bold'},
  phonetic: {color: '#6c63ff', fontSize: 14, marginTop: 4, fontStyle: 'italic'},
  examplesBtn: {marginTop: 12, alignSelf: 'flex-start', backgroundColor: '#2a2a3e', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6},
  examplesBtnText: {color: '#6c63ff', fontSize: 13, fontWeight: '600'},
  exampleBox: {marginTop: 12, backgroundColor: '#16162a', borderRadius: 10, padding: 12},
  exampleLabel: {color: '#6c63ff', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8},
  exampleWordRow: {flexDirection: 'row', flexWrap: 'wrap'},
  exampleWord: {color: '#ddd', fontSize: 14, lineHeight: 22},
  miniCard: {backgroundColor: '#2a2a3e', borderRadius: 6, padding: 8, marginBottom: 4, minWidth: 80},
  miniCloseRow: {alignItems: 'flex-end'},
  miniClose: {color: '#888', fontSize: 14},
  miniTranslation: {color: '#fff', fontSize: 13, fontWeight: '600'},
  miniPhonetic: {color: '#6c63ff', fontSize: 11, fontStyle: 'italic'},
  similarBox: {marginTop: 14},
  similarLabel: {color: '#6c63ff', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8},
  chip: {backgroundColor: '#2a2a3e', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8, alignItems: 'center'},
  chipEn: {color: '#aaa', fontSize: 11},
  chipEs: {color: '#fff', fontSize: 13, fontWeight: '600'},
});
