# Bonus: Offline Mode — Strategy & Architecture

## Overview

Music Room supports a **read-only offline mode** with a **simple sync queue** for votes. When the device loses network connectivity, the app continues to display cached data and allows users to queue votes that are automatically synchronized when the connection is restored.

## Architecture

### Technology Stack

| Component | Role |
|-----------|------|
| `@react-native-community/netinfo` | Detects network state changes in real-time |
| `AsyncStorage` | Persists cached data and offline vote queue locally |
| `Zustand` (networkStore) | Shares `isConnected` state across the app reactively |

### Components

```
NetInfo.addEventListener()
    │
    ▼
networkStore (Zustand)
    │
    ├─► OfflineBanner (red bar in AppNavigator)
    ├─► HomeScreen (loads from cache if offline, hides create buttons)
    └─► EventScreen (queues votes to AsyncStorage if offline)

On reconnect (isConnected: false → true):
    └─► syncOfflineVotes() → POST each queued vote → clear queue
    └─► HomeScreen re-fetches fresh data on next focus
```

## Offline Behavior

### What works offline

- **Viewing the home feed**: Events and playlists from the last successful fetch are cached in AsyncStorage (keys: `cache:events`, `cache:playlists`). When offline, the app loads this cached data instead of making API calls.
- **Voting on tracks**: Votes are saved to a local queue (`offlineVotesQueue` in AsyncStorage) with optimistic UI update (vote count incremented locally). A confirmation alert tells the user the vote will be sent later.
- **Navigation**: Users can browse cached lists and view event/playlist details if already loaded.

### What is disabled offline

- **Creating events or playlists**: The create buttons are hidden when offline. Creating content requires server-side validation and ID generation, so it cannot be done offline.
- **Adding tracks**: Requires server-side validation.
- **Inviting friends**: Requires real-time server interaction.
- **Real-time updates**: Socket.io events are naturally unavailable.

### Visual Indicator

A red banner appears at the top of the screen: **"Mode Hors-Ligne (Lecture seule)"** with a cloud-offline icon. This banner is visible on all main screens but not on authentication screens.

## Sync Mechanism

When NetInfo detects that the network is back online (`isConnected` transitions from `false` to `true`):

1. **Vote sync**: The app reads the `offlineVotesQueue` from AsyncStorage. For each queued vote, it sends a `POST /api/events/:id/tracks/:trackId/vote` request. Once all are processed, the queue is cleared. A summary alert shows how many votes were synced.

2. **Data refresh**: On the next screen focus, `HomeScreen` detects `isConnected = true` and fetches fresh data from the API, replacing the stale cache.

## Conflict Management

### Strategy: Server is Truth / Last Write Wins

We use a **"Server is Truth"** approach. The server is the single source of truth for all data. Offline actions are replayed as standard API calls when the connection returns.

### Conflict scenarios and handling

| Scenario | What happens |
|----------|-------------|
| Offline vote on a track that was deleted by someone else | The backend returns 404. The mobile app silently drops this queued action — no error shown to the user since the track no longer exists. |
| Offline vote on an event that was deleted | Same as above — the backend returns 404, the vote is dropped. |
| User already voted on this track (duplicate vote) | The backend returns a 409 conflict. The mobile app drops the duplicate silently. |
| Multiple offline votes from different users on the same track | Each vote is processed sequentially. The server handles concurrency with Prisma transactions, so all valid votes are counted correctly. |

### Obsolete data

When the app comes back online, the cached data in AsyncStorage may be stale (events deleted, new playlists created, vote counts changed). This is handled by:

1. **Automatic refresh on focus**: `HomeScreen` uses `useFocusEffect` to re-fetch data every time the screen gains focus. When the connection returns and the user navigates to the home screen, fresh data replaces the cache.
2. **Cache update**: Every successful fetch in online mode overwrites the AsyncStorage cache with the latest data.
3. **No stale data editing**: Since the offline mode is read-only (except for vote queueing), users cannot make decisions based on stale data that would cause conflicts.

## Why this approach

The project subject (PDF) warns that offline mode is complex and allows the offline experience to be "completely different." Our approach keeps things pragmatic:

- **Read-only cache** avoids the complexity of offline mutations with conflict resolution
- **Vote queueing** demonstrates a real sync mechanism with conflict handling
- **Server is Truth** is the simplest and most reliable conflict resolution strategy
- The implementation adds minimal complexity (one new Zustand store, a few AsyncStorage calls) while fully satisfying the bonus requirements
