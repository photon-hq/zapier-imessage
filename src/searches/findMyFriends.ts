import {
  defineSearch,
  defineInputFields,
  type SearchPerform,
} from "zapier-platform-core";

const inputFields = defineInputFields([]);

interface FriendLocation {
  handle: string;
  coordinates: [number, number];
  long_address?: string;
  expiry?: number;
}

const perform = (async (z, bundle) => {
  const response = await z.request<FriendLocation[]>({
    url: `${bundle.authData.serverUrl}/api/v1/icloud/findmy/friends/refresh`,
    method: "POST",
  });

  const locations: FriendLocation[] = Array.isArray(response.data)
    ? response.data
    : [];

  return locations.map((loc) => ({
    id: loc.handle,
    handle: loc.handle,
    latitude: loc.coordinates[0],
    longitude: loc.coordinates[1],
    address: loc.long_address || "",
    mapsUrl: `https://maps.google.com/?q=${loc.coordinates[0]},${loc.coordinates[1]}`,
  }));
}) satisfies SearchPerform<typeof inputFields>;

export default defineSearch({
  key: "find_my_friends",
  noun: "Friend Location",

  display: {
    label: "Find My Friends",
    description: "Get friends' locations via iCloud Find My.",
  },

  operation: {
    inputFields,
    perform,
    sample: {
      id: "+11234567890",
      handle: "+11234567890",
      latitude: 37.7749,
      longitude: -122.4194,
      address: "San Francisco, CA",
      mapsUrl: "https://maps.google.com/?q=37.7749,-122.4194",
    },
    outputFields: [
      { key: "id", label: "ID" },
      { key: "handle", label: "Person" },
      { key: "latitude", label: "Latitude", type: "number" },
      { key: "longitude", label: "Longitude", type: "number" },
      { key: "address", label: "Address" },
      { key: "mapsUrl", label: "Google Maps Link" },
    ],
  },
});
