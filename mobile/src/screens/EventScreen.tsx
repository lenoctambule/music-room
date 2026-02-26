import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Keyboard,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import api from '../services/api';
import { getSocket, connectSocket } from '../services/socket';

type Props = NativeStackScreenProps<RootStackParamList, 'Event'>;

interface Track {
  id: string;
  title: string;
  artist: string;
  voteCount: number;
  externalUrl: string | null;
}

interface EventData {
  id: string;
  name: string;
  description: string | null;
  licenseType: string;
}

export default function EventScreen({ route }: Props) {
  const { eventId } = route.params;
  const [event, setEvent] = useState<EventData | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [adding, setAdding] = useState(false);
  const [votingId, setVotingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    setupSocket();

    return () => {
      const socket = getSocket();
      socket.emit('leaveEvent', eventId);
      socket.off('trackAdded');
      socket.off('trackVoted');
    };
  }, [eventId]);

  const fetchData = async () => {
    try {
      const [eventRes, tracksRes] = await Promise.all([
        api.get(`/events/${eventId}`),
        api.get(`/events/${eventId}/tracks`),
      ]);
      setEvent(eventRes.data.data);
      setTracks(tracksRes.data.data);
    } catch {
      Alert.alert('Erreur', 'Impossible de charger l\'evenement');
    } finally {
      setLoading(false);
    }
  };

  const setupSocket = () => {
    connectSocket();
    const socket = getSocket();
    socket.emit('joinEvent', eventId);

    socket.on('trackAdded', (data) => {
      if (data.eventId === eventId) {
        setTracks(data.tracks as Track[]);
      }
    });

    socket.on('trackVoted', (data) => {
      if (data.eventId === eventId) {
        setTracks(data.tracks as Track[]);
      }
    });
  };

  const handleAddTrack = async () => {
    if (!title.trim() || !artist.trim()) {
      Alert.alert('Erreur', 'Titre et artiste requis');
      return;
    }

    Keyboard.dismiss();
    setAdding(true);
    try {
      await api.post(`/events/${eventId}/tracks`, {
        title: title.trim(),
        artist: artist.trim(),
      });
      setTitle('');
      setArtist('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error
        || 'Impossible d\'ajouter la track';
      Alert.alert('Erreur', msg);
    } finally {
      setAdding(false);
    }
  };

  const handleVote = async (trackId: string) => {
    setVotingId(trackId);
    try {
      await api.post(`/events/${eventId}/tracks/${trackId}/vote`, {
        latitude: 48.85,
        longitude: 2.35,
      });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error
        || 'Impossible de voter';
      Alert.alert('Erreur', msg);
    } finally {
      setVotingId(null);
    }
  };

  const renderTrack = ({ item, index }: { item: Track; index: number }) => (
    <View style={styles.trackCard}>
      <View style={styles.trackRank}>
        <Text style={styles.rankNumber}>{index + 1}</Text>
      </View>
      <View style={styles.trackInfo}>
        <Text style={styles.trackTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.trackArtist} numberOfLines={1}>{item.artist}</Text>
      </View>
      <TouchableOpacity
        style={styles.voteButton}
        onPress={() => handleVote(item.id)}
        disabled={votingId === item.id}
      >
        {votingId === item.id ? (
          <ActivityIndicator size="small" color="#4f46e5" />
        ) : (
          <>
            <Text style={styles.voteCount}>{item.voteCount}</Text>
            <Text style={styles.voteLabel}>Vote</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {event?.description ? (
          <Text style={styles.description}>{event.description}</Text>
        ) : null}

        <View style={styles.addForm}>
          <Text style={styles.formTitle}>Ajouter une track</Text>
          <View style={styles.formRow}>
            <TextInput
              style={[styles.formInput, { flex: 1, marginRight: 8 }]}
              placeholder="Titre"
              placeholderTextColor="#999"
              value={title}
              onChangeText={setTitle}
              multiline={false}
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />
            <TextInput
              style={[styles.formInput, { flex: 1 }]}
              placeholder="Artiste"
              placeholderTextColor="#999"
              value={artist}
              onChangeText={setArtist}
              multiline={false}
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />
          </View>
          <TouchableOpacity
            style={[styles.addButton, adding && styles.buttonDisabled]}
            onPress={handleAddTrack}
            disabled={adding}
          >
            {adding ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.addButtonText}>Ajouter</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>
          Tracklist ({tracks.length})
        </Text>

        <FlatList
          data={tracks}
          keyExtractor={(item) => item.id}
          renderItem={renderTrack}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <Text style={styles.emptyText}>Aucune track pour le moment</Text>
          }
        />
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  description: {
    fontSize: 14,
    color: '#666',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  addForm: {
    backgroundColor: '#fff',
    margin: 12,
    padding: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  formTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
    marginBottom: 10,
  },
  formRow: {
    flexDirection: 'row',
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    backgroundColor: '#fafafa',
    color: '#1a1a1a',
  },
  addButton: {
    backgroundColor: '#4f46e5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
  },
  list: {
    paddingHorizontal: 12,
    paddingBottom: 32,
  },
  trackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  trackRank: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: '#666',
  },
  trackInfo: {
    flex: 1,
    marginRight: 10,
  },
  trackTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  trackArtist: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  voteButton: {
    backgroundColor: '#eef2ff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 58,
  },
  voteCount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4f46e5',
  },
  voteLabel: {
    fontSize: 11,
    color: '#6366f1',
    marginTop: 1,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 30,
    fontSize: 15,
  },
});
