import { defineTrigger } from "zapier-platform-core";
import type { ZObject, Bundle } from "zapier-platform-core";
import { subscribe, unsubscribe, makePerform } from "./webhookHelpers.js";

const performList = async (_z: ZObject, _bundle: Bundle) => [
  {
    id: "loc-friend-1234",
    name: "John Doe",
    latitude: 37.7749,
    longitude: -122.4194,
    address: "San Francisco, CA",
    timestamp: 1700000000000,
  },
];

const perform = makePerform("new-findmy-location", (data) => ({
  id: (data.id as string) || `loc-${Date.now()}`,
  name: data.name,
  latitude: data.latitude ?? data.lat,
  longitude: data.longitude ?? data.lng ?? data.lon,
  address: data.address,
  timestamp: data.timestamp ?? data.lastUpdated,
}));

export default defineTrigger({
  key: "findmy_location_instant",
  noun: "Location",

  display: {
    label: "Find My Location Updated",
    description:
      "Triggers when a Find My Friends location is updated on your Photon server.",
  },

  operation: {
    type: "hook",
    perform,
    performList,
    performSubscribe: subscribe,
    performUnsubscribe: unsubscribe,

    sample: {
      id: "loc-friend-1234",
      name: "John Doe",
      latitude: 37.7749,
      longitude: -122.4194,
      address: "San Francisco, CA",
      timestamp: 1700000000000,
    },
    outputFields: [
      { key: "id", label: "ID" },
      { key: "name", label: "Name" },
      { key: "latitude", label: "Latitude", type: "number" },
      { key: "longitude", label: "Longitude", type: "number" },
      { key: "address", label: "Address" },
      { key: "timestamp", label: "Timestamp", type: "integer" },
    ],
  },
});
