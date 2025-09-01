import { useAPI, CACHE_KEYS } from '../utils/apiFetcher';

export function useUserBookings(userId) {
  return useAPI(
    userId ? CACHE_KEYS.USER_BOOKINGS(userId) : null,
    {
      refreshInterval: 30 * 1000, // Refresh every 30 seconds for real-time updates
      dedupingInterval: 10 * 1000, // 10 seconds deduping
    }
  );
}

export function useJamRoomBookings(jamRoomId) {
  return useAPI(
    jamRoomId ? CACHE_KEYS.JAM_ROOM_BOOKINGS(jamRoomId) : null,
    {
      refreshInterval: 15 * 1000, // 15 seconds for admin panel
      dedupingInterval: 5 * 1000,
    }
  );
}

export function useJamRoomDetails(jamRoomId) {
  return useAPI(
    jamRoomId ? CACHE_KEYS.JAM_ROOM_DETAILS(jamRoomId) : null,
    {
      refreshInterval: 2 * 60 * 1000, // 2 minutes
    }
  );
}

export function useJamRoomAddons(jamRoomId) {
  return useAPI(
    jamRoomId ? CACHE_KEYS.JAM_ROOM_ADDONS(jamRoomId) : null,
    {
      refreshInterval: 5 * 60 * 1000, // 5 minutes
    }
  );
}

export function useJamRoomServices(jamRoomId) {
  return useAPI(
    jamRoomId ? CACHE_KEYS.JAM_ROOM_SERVICES(jamRoomId) : null,
    {
      refreshInterval: 10 * 60 * 1000, // 10 minutes
    }
  );
}

export function useJamroomDetails(jamroomId) {
  return useAPI(
    jamroomId ? CACHE_KEYS.JAM_ROOM_DETAILS(jamroomId): null,
    {
      refreshInterval: 10 * 60 * 1000, // 10 minutes
      dedupingInterval: 5 * 60 * 1000, // 5 minutes deduping
    }
  )
}

export function useSpotifyAlbums(artistId) {
  return useAPI(
    artistId ? CACHE_KEYS.SPOTIFY_ALBUMS(artistId) : null,
    {
      refreshInterval: 24 * 60 * 60 * 1000, // 24 hours - albums don't change often
      dedupingInterval: 30 * 60 * 1000, // 30 minutes deduping
    }
  );
}