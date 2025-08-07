import useSWR, {mutate} from 'swr';

const API_BASE_URL = 'https://api.vision.gigsaw.co.in/api';

// Global fetcher function for GET requests
export const fetcher = async (url) => {
  const res = await fetch(url);
  
  // If the status code is not 2xx, throw an error
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.');
    error.info = await res.json();
    error.status = res.status;
    throw error;
  }
  
  return res.json();
};

// Enhanced SWR hook with better cache configuration
export function useAPI(endpoint, config = {}) {
  const { data, error, mutate: boundMutate, isLoading, isValidating } = useSWR(
    endpoint ? `${API_BASE_URL}${endpoint}` : null,
    fetcher,
    {
      revalidateOnFocus: false, // Prevent unnecessary refetches on focus
      revalidateOnReconnect: true,
      dedupingInterval: 30000, // 30 seconds - prevent duplicate requests
      focusThrottleInterval: 60000, // 1 minute
      errorRetryCount: 3,
      errorRetryInterval: 5000,
      suspense: false,
      refreshInterval: 0, // Disable auto-refresh by default
      ...config,
    }
  );

  return {
    data,
    isLoading,
    isError: !!error,
    error,
    mutate: boundMutate,
    isValidating,
  };
}

// Cache keys for consistent cache management
export const CACHE_KEYS = {
  JAM_ROOMS: '/jamrooms',
  JAM_ROOM_DETAILS: (id) => `/jamrooms/id/${id}`,
  JAM_ROOM_ADDONS: (id) => `/jamrooms/${id}/addons`,
  JAM_ROOM_SERVICES: (id) => `/jamrooms/${id}/services`,
  USER_BOOKINGS: (userId) => `/bookings/users/${userId}`,
  JAM_ROOM_BOOKINGS: (jamRoomId) => `/bookings/jamroom/${jamRoomId}`,
  PAYOUTS: (jamRoomId) => `/payouts/${jamRoomId}`,
  USER_PROFILE: '/users',
  SUBSCRIPTIONS: '/subscriptions',
  SPOTIFY_ALBUMS: (artistId) => `/spotify/artist-albums/${artistId}`,
};

// Global mutation function
export const mutateAPI = (endpoint, data, shouldRevalidate = true) => {
  return mutate(`${API_BASE_URL}${endpoint}`, data, shouldRevalidate);
};

// Enhanced API client with cache invalidation
export const apiClient = {
  post: async (endpoint, data, options = {}) => {
    const { invalidateCache = [], mutateKey = null } = options;
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: JSON.stringify(data),
    });
    
    const responseData = await response.json();
    
    // Invalidate related cache entries
    if (invalidateCache.length > 0) {
      invalidateCache.forEach(key => mutateAPI(key));
    }
    
    if (mutateKey) {
      mutateAPI(mutateKey, responseData);
    }
    
    return responseData;
  },

  put: async (endpoint, data, options = {}) => {
    const { invalidateCache = [], mutateKey = null } = options;
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: JSON.stringify(data),
    });
    
    const responseData = await response.json();
    
    if (invalidateCache.length > 0) {
      invalidateCache.forEach(key => mutateAPI(key));
    }
    
    if (mutateKey) {
      mutateAPI(mutateKey, responseData);
    }
    
    return responseData;
  },

  delete: async (endpoint, options = {}) => {
    const { invalidateCache = [] } = options;
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    const responseData = await response.json();
    
    if (invalidateCache.length > 0) {
      invalidateCache.forEach(key => mutateAPI(key));
    }
    
    return responseData;
  }
};