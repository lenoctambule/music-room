import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

interface UserProfile {
  name: string;
  email: string;
  publicInfo: string | null;
  friendsInfo: string | null;
  privateInfo: string | null;
  musicPreferences: string[];
}

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [name, setName] = useState('');
  const [publicInfo, setPublicInfo] = useState('');
  const [friendsInfo, setFriendsInfo] = useState('');
  const [privateInfo, setPrivateInfo] = useState('');
  const [musicPrefs, setMusicPrefs] = useState('');

  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/users/me');
      const user = data.data as UserProfile;
      setProfile(user);
      setName(user.name);
      setPublicInfo(user.publicInfo || '');
      setFriendsInfo(user.friendsInfo || '');
      setPrivateInfo(user.privateInfo || '');
      setMusicPrefs(user.musicPreferences.join(', '));
    } catch {
      Alert.alert('Erreur', 'Impossible de charger le profil');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Erreur', 'Le nom ne peut pas etre vide');
      return;
    }

    setSaving(true);
    try {
      const musicPreferences = musicPrefs
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await api.put('/users/me', {
        name: name.trim(),
        publicInfo: publicInfo || undefined,
        friendsInfo: friendsInfo || undefined,
        privateInfo: privateInfo || undefined,
        musicPreferences,
      });
      Alert.alert('Succes', 'Profil mis a jour');
    } catch {
      Alert.alert('Erreur', 'Impossible de mettre a jour le profil');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Deconnexion', 'Voulez-vous vous deconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Deconnexion', style: 'destructive', onPress: () => logout() },
    ]);
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
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.email}>{profile?.email}</Text>

        <Text style={styles.label}>Nom</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} />

        <Text style={styles.label}>Info publique</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={publicInfo}
          onChangeText={setPublicInfo}
          placeholder="Visible par tout le monde"
          placeholderTextColor="#bbb"
          multiline
        />

        <Text style={styles.label}>Info amis uniquement</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={friendsInfo}
          onChangeText={setFriendsInfo}
          placeholder="Visible par vos amis"
          placeholderTextColor="#bbb"
          multiline
        />

        <Text style={styles.label}>Info privee</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={privateInfo}
          onChangeText={setPrivateInfo}
          placeholder="Visible uniquement par vous"
          placeholderTextColor="#bbb"
          multiline
        />

        <Text style={styles.label}>Preferences musicales</Text>
        <TextInput
          style={styles.input}
          value={musicPrefs}
          onChangeText={setMusicPrefs}
          placeholder="jazz, rock, electro..."
          placeholderTextColor="#bbb"
        />
        <Text style={styles.hint}>Separez par des virgules</Text>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Enregistrer</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Se deconnecter</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
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
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  email: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
    color: '#1a1a1a',
  },
  multiline: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: '#4f46e5',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 28,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '500',
  },
});
