import {
  defineSearch,
  defineInputFields,
  type SearchPerform,
} from "zapier-platform-core";

const inputFields = defineInputFields([
  {
    key: "query",
    label: "Name",
    type: "string",
    required: false,
    helpText: "Filter contacts by name. Leave blank to return all contacts.",
  },
]);

interface Contact {
  id: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  phoneNumbers?: Array<{ address: string }>;
  emails?: Array<{ address: string }>;
}

const perform = (async (z, bundle) => {
  const response = await z.request<Contact[]>({
    url: `${bundle.authData.serverUrl}/api/v1/contact`,
    method: "GET",
  });

  let contacts: Contact[] = Array.isArray(response.data)
    ? response.data
    : (response.data as unknown as { data?: Contact[] })?.data ?? [];

  if (bundle.inputData.query) {
    const q = bundle.inputData.query.toLowerCase();
    contacts = contacts.filter((c) => {
      const name = (c.displayName || `${c.firstName || ""} ${c.lastName || ""}`)
        .toLowerCase();
      return name.includes(q);
    });
  }

  return contacts.slice(0, 50).map((c) => ({
    id: c.id || c.displayName || "unknown",
    firstName: c.firstName,
    lastName: c.lastName,
    displayName: c.displayName,
    phones: c.phoneNumbers?.map((p) => p.address).join(", ") || "",
    emails: c.emails?.map((e) => e.address).join(", ") || "",
  }));
}) satisfies SearchPerform<typeof inputFields>;

export default defineSearch({
  key: "get_contacts",
  noun: "Contact",

  display: {
    label: "Get Contacts",
    description: "Fetch device contacts from your Photon server.",
  },

  operation: {
    inputFields,
    perform,
    sample: {
      id: "contact-1",
      firstName: "John",
      lastName: "Doe",
      displayName: "John Doe",
      phones: "+11234567890",
      emails: "john@example.com",
    },
    outputFields: [
      { key: "id", label: "ID" },
      { key: "firstName", label: "First Name" },
      { key: "lastName", label: "Last Name" },
      { key: "displayName", label: "Display Name" },
      { key: "phones", label: "Phone Numbers" },
      { key: "emails", label: "Email Addresses" },
    ],
  },
});
