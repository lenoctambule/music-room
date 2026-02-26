import { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Keyboard,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import api from '../services/api';

interface UserResult {
  id: string;
  name: string;
  email: string;
}

interface PendingRequest {
  id: string;
  name: string;
  email: string;
  requestId: string;
}

export default function FriendsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [friends, setFriends] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [acceptingFrom, setAcceptingFrom] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const [pendingRes, friendsRes] = await Promise.all([
        api.get('/users/friend-requests/pending'),
        api.get('/users/me/friends'),
      ]);
      setPendingRequests(pendingRes.data.data);
      setFriends(friendsRes.data.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleSearch = async () => {
    if (searchEmail.trim().length < 2) {
      Alert.alert('Erreur', 'Entrez au moins 2 caracteres');
      return;
    }
    Keyboard.dismiss();
    setSearching(true);
    try {
      const { data } = await api.get(`/users/search?email=${encodeURIComponent(searchEmail.trim())}`);
      setSearchResults(data.data);
      if (data.data.length === 0) {
        Alert.alert('Aucun resultat', 'Aucun utilisateur trouve avec cet email');
      }
    } catch {
      Alert.alert('Erreur', 'Impossible de rechercher');
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (userId: string) => {
    setSendingTo(userId);
    try {
      await api.post(`/users/friend-requests/${userId}`);
      Alert.alert('Succes', 'Demande d\'ami envoyee !');
      setSearchResults(prev => prev.filter(u => u.id !== userId));
      setSearchEmail('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error
        || 'Impossible d\'envoyer la demande';
      Alert.alert('Erreur', msg);
    } finally {
      setSendingTo(null);
    }
  };

  const handleAccept = async (friendId: string) => {
    setAcceptingFrom(friendId);
    try {
      await api.put(`/users/friend-requests/${friendId}/accept`);
      await loadData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error
        || 'Impossible d\'accepter';
      Alert.alert('Erreur', msg);
    } finally {
      setAcceptingFrom(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.content}
      >
        {/* Search section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rechercher un utilisateur</Text>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              placeholder="Email..."
              placeholderTextColor="#999"
              value={searchEmail}
              onChangeText={setSearchEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />
            <TouchableOpacity
              style={[styles.searchButton, searching && styles.buttonDisabled]}
              onPress={handleSearch}
              disabled={searching}
            >
              {searching ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.searchButtonText}>Chercher</Text>
              )}
            </TouchableOpacity>
          </View>

          {searchResults.map(user => (
            <View key={user.id} style={styles.userCard}>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
              </View>
              <TouchableOpacity
                style={[styles.actionBtn, sendingTo === user.id && styles.buttonDisabled]}
                onPress={() => handleSendRequest(user.id)}
                disabled={sendingTo === user.id}
              >
                {sendingTo === user.id ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.actionBtnText}>Ajouter</Text>
                )}
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Pending requests */}
        {pendingRequests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Demandes en attente ({pendingRequests.length})
            </Text>
            {pendingRequests.map(req => (
              <View key={req.id} style={styles.userCard}>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{req.name}</Text>
                  <Text style={styles.userEmail}>{req.email}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.acceptBtn, acceptingFrom === req.id && styles.buttonDisabled]}
                  onPress={() => handleAccept(req.id)}
                  disabled={acceptingFrom === req.id}
                >
                  {acceptingFrom === req.id ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.actionBtnText}>Accepter</Text>
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Friends list */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mes amis ({friends.length})</Text>
          {friends.length === 0 ? (
            <Text style={styles.emptyText}>Aucun ami pour le moment</Text>
          ) : (
            friends.map(friend => (
              <TouchableOpacity
                key={friend.id}
                style={styles.friendCard}
                onPress={() => navigation.navigate('UserProfile', { userId: friend.id })}
              >
                <View style={styles.friendInfo}>
                  <Text style={styles.userName}>{friend.name}</Text>
                  <Text style={styles.userEmail}>{friend.email}</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
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
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    backgroundColor: '#fff',
    color: '#1a1a1a',
  },
  searchButton: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  userCard: {
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
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  userEmail: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  actionBtn: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 75,
    alignItems: 'center',
  },
  acceptBtn: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  friendCard: {
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
  friendInfo: {
    flex: 1,
  },
  chevron: {
    fontSize: 22,
    color: '#ccc',
    fontWeight: '300',
    marginLeft: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 16,
    fontSize: 14,
  },
});
