
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371 // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function findClosestJamRooms() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // Fetch jam rooms from MongoDB API
          const response = await fetch('http://43.205.169.90/api/jamrooms');
          const data = await response.json();
          console.log(data);

          if (!data || !data.success) {
            throw new Error("No jam rooms data received");
          }

          // Calculate distance for each room
          const jamRoomsWithDistance = data.data.map((room) => ({
            id: room._id,
            type: room.type,
            name: room.jamRoomDetails.name,
            description: room.jamRoomDetails.description,
            location: room.location,
            slots: room.slots,
            distance: calculateDistance(
              latitude, 
              longitude, 
              room.location.latitude, 
              room.location.longitude
            ),
            feesPerSlot: room.feesPerSlot,
            ownerDetails: room.ownerDetails, // Add this
            images: room.images
          }));
          console.log(latitude, longitude);

          // Sort by distance
          const sortedJamRooms = jamRoomsWithDistance.sort(
            (a, b) => a.distance - b.distance
          );

          resolve({
            userLatitude: latitude,
            userLongitude: longitude,
            jamRooms: sortedJamRooms
          });
          console.log("Closest jam rooms:", sortedJamRooms);

        } catch (error) {
          console.error("Error fetching jam rooms:", error);
          reject(error);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        reject(new Error(`Geolocation error: ${error.message}`));
      }
    );
  });
}

// export function findClosestJamRooms() {
//   return new Promise((resolve, reject) => {
//     navigator.geolocation.getCurrentPosition(
//       async (position) => {
//         const { latitude, longitude } = position.coords

//         try {
//           console.log("Fetching jam rooms...")
//           const { data } = await client.query({
//             query: gql`
//               query {
//                 jamRooms {
//                   id
//                   name
//                   latitude
//                   longitude
//                   radius
//                 }
//               }
//             `,
//           })
//           console.log("Fetched data:", data)

//           if (!data || !data.jamRooms) {
//             throw new Error("No jam rooms data received")
//           }

//           const jamRoomsWithDistance = data.jamRooms.map((room) => ({
//             ...room,
//             distance: calculateDistance(latitude, longitude, room.latitude, room.longitude),
//           }))

//           const sortedJamRooms = jamRoomsWithDistance.sort((a, b) => a.distance - b.distance)
//           resolve({
//             userLatitude: latitude,
//             userLongitude: longitude,
//             jamRooms: sortedJamRooms
//           })
//         } catch (error) {
//           console.error("Error in findClosestJamRooms:", error)
//           reject(error)
//         }
//       },
//       (error) => {
//         console.error("Geolocation error:", error)
//         reject(new Error(`Geolocation error: ${error.message}`))
//       }
//     )
//   })
// }

