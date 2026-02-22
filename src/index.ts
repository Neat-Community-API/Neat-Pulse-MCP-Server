#!/usr/bin/env node

/**
 * Neat Pulse MCP Server
 *
 * A custom Model Context Protocol server that wraps the entire
 * Neat Pulse REST API, giving Claude (or any MCP client) the
 * ability to query devices, read sensor data, manage rooms,
 * locations, regions, users, and issue device commands.
 *
 * Environment variables:
 *   NEAT_PULSE_API_KEY  – Bearer token from Pulse Settings > API keys
 *   NEAT_PULSE_ORG_ID   – Organisation ID from Pulse Settings
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { NeatPulseClient } from "./client.js";

// ── Bootstrap ──────────────────────────────────────────────────────

const apiKey = process.env.NEAT_PULSE_API_KEY;
const orgId = process.env.NEAT_PULSE_ORG_ID;

if (!apiKey || !orgId) {
  console.error(
    "Error: NEAT_PULSE_API_KEY and NEAT_PULSE_ORG_ID environment variables are required."
  );
  process.exit(1);
}

const pulse = new NeatPulseClient({ apiKey, orgId });

const server = new McpServer({
  name: "neat-pulse",
  version: "1.0.0",
});

// ── Helper ─────────────────────────────────────────────────────────

function json(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

function error(message: string) {
  return {
    content: [{ type: "text" as const, text: `Error: ${message}` }],
    isError: true,
  };
}

// ── Endpoints (Devices) Tools ──────────────────────────────────────

server.tool(
  "list_devices",
  "List all Neat devices in the organization. Optionally filter by region or location.",
  {
    regionId: z.number().optional().describe("Filter by region ID"),
    locationId: z.number().optional().describe("Filter by location ID"),
  },
  async ({ regionId, locationId }) => {
    try {
      const data = await pulse.listEndpoints(regionId, locationId);
      return json(data);
    } catch (e: any) {
      return error(e.message);
    }
  }
);

server.tool(
  "get_device",
  "Get detailed info and status for a specific Neat device by its ID.",
  {
    id: z.string().describe("The endpoint/device ID"),
  },
  async ({ id }) => {
    try {
      const data = await pulse.getEndpoint(id);
      return json(data);
    } catch (e: any) {
      return error(e.message);
    }
  }
);

server.tool(
  "get_device_settings",
  "Get the current settings and configuration for a specific device.",
  {
    id: z.string().describe("The endpoint/device ID"),
  },
  async ({ id }) => {
    try {
      const data = await pulse.getEndpointSettings(id);
      return json(data);
    } catch (e: any) {
      return error(e.message);
    }
  }
);

server.tool(
  "apply_device_config",
  "Push a new configuration to a device. Pass config as a JSON string of settings to apply.",
  {
    id: z.string().describe("The endpoint/device ID"),
    config: z
      .string()
      .describe("JSON string of configuration settings to apply to the device"),
  },
  async ({ id, config }) => {
    try {
      const parsed = JSON.parse(config);
      const data = await pulse.applyEndpointConfig(id, parsed);
      return json(data);
    } catch (e: any) {
      return error(e.message);
    }
  }
);

server.tool(
  "reboot_device",
  "Reboot a device and any devices paired with it (e.g., a Neat Bar paired with a Neat Pad).",
  {
    id: z.string().describe("The endpoint/device ID to reboot"),
  },
  async ({ id }) => {
    try {
      const data = await pulse.rebootEndpoint(id);
      return json(data);
    } catch (e: any) {
      return error(e.message);
    }
  }
);

server.tool(
  "delete_device",
  "Unenroll a device from the organization. This removes it from Pulse management.",
  {
    id: z.string().describe("The endpoint/device ID to delete"),
  },
  async ({ id }) => {
    try {
      const data = await pulse.deleteEndpoint(id);
      return json(data);
    } catch (e: any) {
      return error(e.message);
    }
  }
);

// ── Sensor Data Tools ──────────────────────────────────────────────

server.tool(
  "get_device_sensors",
  "Get the most recent sensor data sample for a single device (temperature, humidity, CO2, VOC, people count, etc.).",
  {
    id: z.string().describe("The endpoint/device ID"),
  },
  async ({ id }) => {
    try {
      const data = await pulse.getEndpointSensorData(id);
      return json(data);
    } catch (e: any) {
      return error(e.message);
    }
  }
);

server.tool(
  "get_all_device_sensors",
  "Get the most recent sensor data for ALL devices in the organization. Optionally filter by region or location.",
  {
    regionId: z.number().optional().describe("Filter by region ID"),
    locationId: z.number().optional().describe("Filter by location ID"),
  },
  async ({ regionId, locationId }) => {
    try {
      const data = await pulse.getBulkSensorData(regionId, locationId);
      return json(data);
    } catch (e: any) {
      return error(e.message);
    }
  }
);

server.tool(
  "get_room_sensors",
  "Get aggregated sensor data for a room (combines data from all devices in the room). This is the recommended method for room level environmental data.",
  {
    id: z.string().describe("The room ID"),
  },
  async ({ id }) => {
    try {
      const data = await pulse.getRoomSensorData(id);
      return json(data);
    } catch (e: any) {
      return error(e.message);
    }
  }
);

server.tool(
  "get_all_room_sensors",
  "Get sensor data for ALL rooms in the organization.",
  {},
  async () => {
    try {
      const data = await pulse.getBulkRoomSensorData();
      return json(data);
    } catch (e: any) {
      return error(e.message);
    }
  }
);

// ── Room Tools ─────────────────────────────────────────────────────

server.tool(
  "list_rooms",
  "List all rooms in the organization.",
  {},
  async () => {
    try {
      const data = await pulse.listRooms();
      return json(data);
    } catch (e: any) {
      return error(e.message);
    }
  }
);

server.tool(
  "get_room",
  "Get details for a specific room by ID.",
  {
    id: z.string().describe("The room ID"),
  },
  async ({ id }) => {
    try {
      const data = await pulse.getRoom(id);
      return json(data);
    } catch (e: any) {
      return error(e.message);
    }
  }
);

server.tool(
  "create_room",
  "Create a new room. Provide a name and optionally a locationId.",
  {
    name: z.string().describe("Name for the new room"),
    locationId: z.number().optional().describe("Location ID to assign the room to"),
  },
  async (args) => {
    try {
      const data = await pulse.createRoom(args);
      return json(data);
    } catch (e: any) {
      return error(e.message);
    }
  }
);

server.tool(
  "update_room",
  "Update an existing room's name or location assignment.",
  {
    id: z.string().describe("The room ID to update"),
    name: z.string().optional().describe("New name"),
    locationId: z.number().optional().describe("New location ID"),
  },
  async ({ id, ...updates }) => {
    try {
      const data = await pulse.updateRoom(id, updates);
      return json(data);
    } catch (e: any) {
      return error(e.message);
    }
  }
);

server.tool(
  "delete_room",
  "Delete a room by ID.",
  {
    id: z.string().describe("The room ID to delete"),
  },
  async ({ id }) => {
    try {
      const data = await pulse.deleteRoom(id);
      return json(data);
    } catch (e: any) {
      return error(e.message);
    }
  }
);

server.tool(
  "regenerate_room_dec",
  "Regenerate the Device Enrollment Code (DEC) for a room.",
  {
    id: z.string().describe("The room ID"),
  },
  async ({ id }) => {
    try {
      const data = await pulse.regenerateRoomDec(id);
      return json(data);
    } catch (e: any) {
      return error(e.message);
    }
  }
);

// ── Location Tools ─────────────────────────────────────────────────

server.tool(
  "list_locations",
  "List all locations in the organization, including their region assignments.",
  {},
  async () => {
    try {
      const data = await pulse.listLocations();
      return json(data);
    } catch (e: any) {
      return error(e.message);
    }
  }
);

server.tool(
  "create_location",
  "Create a new location. Optionally assign it to an existing region.",
  {
    name: z.string().describe("Name for the new location"),
    regionId: z.number().optional().describe("Region ID to assign to"),
  },
  async (args) => {
    try {
      const data = await pulse.createLocation(args);
      return json(data);
    } catch (e: any) {
      return error(e.message);
    }
  }
);

server.tool(
  "update_location",
  "Update a location's name or region assignment.",
  {
    id: z.number().describe("The location ID to update"),
    name: z.string().optional().describe("New name"),
    regionId: z.number().optional().describe("New region ID"),
  },
  async ({ id, ...updates }) => {
    try {
      const data = await pulse.updateLocation(id, updates);
      return json(data);
    } catch (e: any) {
      return error(e.message);
    }
  }
);

server.tool(
  "delete_location",
  "Delete a location. Rooms assigned to this location will have their location assignment removed.",
  {
    id: z.number().describe("The location ID to delete"),
  },
  async ({ id }) => {
    try {
      const data = await pulse.deleteLocation(id);
      return json(data);
    } catch (e: any) {
      return error(e.message);
    }
  }
);

// ── Region Tools ───────────────────────────────────────────────────

server.tool(
  "list_regions",
  "List all regions in the organization.",
  {},
  async () => {
    try {
      const data = await pulse.listRegions();
      return json(data);
    } catch (e: any) {
      return error(e.message);
    }
  }
);

server.tool(
  "create_region",
  "Create a new region.",
  {
    name: z.string().describe("Name for the new region"),
  },
  async (args) => {
    try {
      const data = await pulse.createRegion(args);
      return json(data);
    } catch (e: any) {
      return error(e.message);
    }
  }
);

server.tool(
  "update_region",
  "Update a region's name.",
  {
    id: z.number().describe("The region ID to update"),
    name: z.string().describe("New name for the region"),
  },
  async ({ id, ...updates }) => {
    try {
      const data = await pulse.updateRegion(id, updates);
      return json(data);
    } catch (e: any) {
      return error(e.message);
    }
  }
);

server.tool(
  "delete_region",
  "Delete a region.",
  {
    id: z.number().describe("The region ID to delete"),
  },
  async ({ id }) => {
    try {
      const data = await pulse.deleteRegion(id);
      return json(data);
    } catch (e: any) {
      return error(e.message);
    }
  }
);

// ── User Tools ─────────────────────────────────────────────────────

server.tool(
  "list_users",
  "List all users in the organization.",
  {},
  async () => {
    try {
      const data = await pulse.listUsers();
      return json(data);
    } catch (e: any) {
      return error(e.message);
    }
  }
);

server.tool(
  "get_user",
  "Get details for a specific user.",
  {
    id: z.string().describe("The user ID"),
  },
  async ({ id }) => {
    try {
      const data = await pulse.getUser(id);
      return json(data);
    } catch (e: any) {
      return error(e.message);
    }
  }
);

server.tool(
  "create_user",
  "Invite a new user to the organization.",
  {
    email: z.string().describe("Email address for the new user"),
    role: z
      .enum(["owner", "admin"])
      .optional()
      .describe("User role: owner or admin"),
    regionIds: z
      .array(z.number())
      .optional()
      .describe("Region IDs to assign (for admin role)"),
  },
  async (args) => {
    try {
      const data = await pulse.createUser(args);
      return json(data);
    } catch (e: any) {
      return error(e.message);
    }
  }
);

server.tool(
  "update_user",
  "Update a user's role or region assignments.",
  {
    id: z.string().describe("The user ID to update"),
    role: z.enum(["owner", "admin"]).optional().describe("New role"),
    regionIds: z
      .array(z.number())
      .optional()
      .describe("Updated region IDs"),
  },
  async ({ id, ...updates }) => {
    try {
      const data = await pulse.updateUser(id, updates);
      return json(data);
    } catch (e: any) {
      return error(e.message);
    }
  }
);

server.tool(
  "delete_user",
  "Remove a user from the organization.",
  {
    id: z.string().describe("The user ID to delete"),
  },
  async ({ id }) => {
    try {
      const data = await pulse.deleteUser(id);
      return json(data);
    } catch (e: any) {
      return error(e.message);
    }
  }
);

// ── Profile Tools ──────────────────────────────────────────────────

server.tool(
  "list_profiles",
  "List all Pulse profiles in the organization.",
  {},
  async () => {
    try {
      const data = await pulse.listProfiles();
      return json(data);
    } catch (e: any) {
      return error(e.message);
    }
  }
);

// ── Audit Log Tools ────────────────────────────────────────────────

server.tool(
  "get_audit_logs",
  "List audit log entries for the organization within a date range.",
  {
    from: z
      .string()
      .describe("Start date in ISO 8601 format, e.g. 2024-01-01T10:00:00Z"),
    to: z
      .string()
      .describe("End date in ISO 8601 format, e.g. 2024-01-02T10:00:00Z"),
    pageToken: z.string().optional().describe("Pagination token"),
    pageSize: z.number().optional().describe("Number of results per page"),
  },
  async ({ from, to, pageToken, pageSize }) => {
    try {
      const data = await pulse.getAuditLogs(from, to, pageToken, pageSize);
      return json(data);
    } catch (e: any) {
      return error(e.message);
    }
  }
);

// ── Bug Report Tools ───────────────────────────────────────────────

server.tool(
  "generate_bug_report",
  "Generate a bug report for one or more devices. Returns a support ID for Neat Support to retrieve logs.",
  {
    ids: z
      .array(z.string())
      .describe("Array of endpoint/device IDs to include in the bug report"),
    uploadInCallLogs: z
      .boolean()
      .optional()
      .describe("Whether to include in-call logs in the report"),
  },
  async ({ ids, uploadInCallLogs }) => {
    try {
      const data = await pulse.generateBugReport(ids, uploadInCallLogs);
      return json(data);
    } catch (e: any) {
      return error(e.message);
    }
  }
);

// ── Room Note Tools ────────────────────────────────────────────────

server.tool(
  "list_room_notes",
  "List all notes for a specific room.",
  {
    roomId: z.string().describe("The room ID"),
  },
  async ({ roomId }) => {
    try {
      const data = await pulse.listRoomNotes(roomId);
      return json(data);
    } catch (e: any) {
      return error(e.message);
    }
  }
);

server.tool(
  "get_room_note",
  "Get a specific note for a room.",
  {
    roomId: z.string().describe("The room ID"),
    noteId: z.string().describe("The note ID"),
  },
  async ({ roomId, noteId }) => {
    try {
      const data = await pulse.getRoomNote(roomId, noteId);
      return json(data);
    } catch (e: any) {
      return error(e.message);
    }
  }
);

server.tool(
  "create_room_note",
  "Create a note for a room.",
  {
    roomId: z.string().describe("The room ID"),
    content: z.string().describe("JSON string of the note content object"),
  },
  async ({ roomId, content }) => {
    try {
      const parsed = JSON.parse(content);
      const data = await pulse.createRoomNote(roomId, parsed);
      return json(data);
    } catch (e: any) {
      return error(e.message);
    }
  }
);

server.tool(
  "delete_room_note",
  "Delete a note from a room.",
  {
    roomId: z.string().describe("The room ID"),
    noteId: z.string().describe("The note ID to delete"),
  },
  async ({ roomId, noteId }) => {
    try {
      const data = await pulse.deleteRoomNote(roomId, noteId);
      return json(data);
    } catch (e: any) {
      return error(e.message);
    }
  }
);

server.tool(
  "list_all_room_notes",
  "List all room notes across every room in the organization.",
  {},
  async () => {
    try {
      const data = await pulse.listAllRoomNotes();
      return json(data);
    } catch (e: any) {
      return error(e.message);
    }
  }
);

// ── Start Server ───────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Neat Pulse MCP server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error starting server:", err);
  process.exit(1);
});
