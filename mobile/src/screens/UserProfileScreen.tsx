import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import api from '../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'UserProfile'>;

interface UserData {
  id: string;
  name: string;
  publicInfo?: string | null;
  friendsInfo?: string | null;
  musicPreferences?: string[];
}

export default function UserProfileScreen({ route, navigation }: Props) {
  const { userId } = route.params;
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, [userId]);

  useEffect(() => {
    if (user) {
      navigation.setOptions({ title: user.name });
    }
  }, [user]);

  const fetchUser = async () => {
    try {
      const { data } = await api.get(`/users/${userId}`);
      setUser(data.data as UserData);
    } catch {
      Alert.alert('Erreur', 'Impossible de charger le profil');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Utilisateur introuvable</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.name}>{user.name}</Text>

      {user.publicInfo ? (
        <View style={styles.infoBlock}>
          <Text style={styles.infoLabel}>Info publique</Text>
          <Text style={styles.infoValue}>{user.publicInfo}</Text>
        </View>
      ) : null}

      {user.friendsInfo ? (
        <View style={styles.infoBlock}>
          <Text style={styles.infoLabel}>Info amis</Text>
          <Text style={styles.infoValue}>{user.friendsInfo}</Text>
        </View>
      ) : null}

      {user.musicPreferences && user.musicPreferences.length > 0 ? (
        <View style={styles.infoBlock}>
          <Text style={styles.infoLabel}>Preferences musicales</Text>
          <View style={styles.tagsRow}>
            {user.musicPreferences.map((pref, i) => (
              <View key={i} style={styles.tag}>
                <Text style={styles.tagText}>{pref}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 28,
  },
  infoBlock: {
    marginBottom: 18,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  tag: {
    backgroundColor: '#eef2ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  tagText: {
    fontSize: 13,
    color: '#4f46e5',
    fontWeight: '500',
  },
  errorText: {
    fontSize: 15,
    color: '#999',
  },
});
