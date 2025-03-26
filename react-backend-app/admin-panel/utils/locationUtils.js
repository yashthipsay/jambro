export const fetchLocationCoordinates = async (placeId) => {
  try {
    const response = await fetch(
      `https://api.olamaps.io/places/v1/details/${placeId}?api_key=tx0FO1vtsTuqyz45MEUIJiYDTFMJOPG9bWR3Yd4k`,
      {
        headers: {
          'X-Request-Id': 'a623e8cd-bcd5-4d9a-beb3-ea7df3f5092e',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch location details');
    }

    const data = await response.json();
    return {
      lat: data.result.geometry.location.lat,
      lng: data.result.geometry.location.lng,
    };
  } catch (error) {
    console.error('Error fetching location details:', error);
    throw error;
  }
};
