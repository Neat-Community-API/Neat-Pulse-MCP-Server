/**
 * Neat Pulse API Client
 *
 * Handles authentication and HTTP requests to the Neat Pulse REST API.
 * Base URL: https://api.pulse.neat.no/v1
 */

const BASE_URL = "https://api.pulse.neat.no/v1";

export interface PulseClientConfig {
  apiKey: string;
  orgId: string;
}

export class NeatPulseClient {
  private apiKey: string;
  private orgId: string;

  constructor(config: PulseClientConfig) {
    this.apiKey = config.apiKey;
    this.orgId = config.orgId;
  }

  private get headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  private url(path: string): string {
    return `${BASE_URL}/orgs/${this.orgId}${path}`;
  }

  private async request(
    method: string,
    path: string,
    body?: unknown
  ): Promise<unknown> {
    const options: RequestInit = {
      method,
      headers: this.headers,
    };
    if (body !== undefined) {
      options.body = JSON.stringify(body);
    }

    const res = await fetch(this.url(path), options);

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `Neat Pulse API ${method} ${path} returned ${res.status}: ${text}`
      );
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      return res.json();
    }
    return res.text();
  }

  // ── Endpoints (Devices) ──────────────────────────────────────────

  /** List all endpoints (devices) in the org, optionally filtered. */
  async listEndpoints(regionId?: number, locationId?: number) {
    const params = new URLSearchParams();
    if (regionId !== undefined) params.set("regionId", String(regionId));
    if (locationId !== undefined) params.set("locationId", String(locationId));
    const qs = params.toString();
    return this.request("GET", `/endpoints${qs ? `?${qs}` : ""}`);
  }

  /** Get detailed info for a single endpoint. */
  async getEndpoint(id: string) {
    return this.request("GET", `/endpoints/${id}`);
  }

  /** Get current config/settings for an endpoint. */
  async getEndpointSettings(id: string) {
    return this.request("GET", `/endpoints/${id}/config`);
  }

  /** Apply config to an endpoint. */
  async applyEndpointConfig(id: string, config: Record<string, unknown>) {
    return this.request("POST", `/endpoints/${id}/config`, config);
  }

  /** Reboot an endpoint (and its paired devices). */
  async rebootEndpoint(id: string) {
    return this.request("POST", `/endpoints/${id}/reboot`);
  }

  /** Delete (unenroll) an endpoint. */
  async deleteEndpoint(id: string) {
    return this.request("DELETE", `/endpoints/${id}`);
  }

  /** Get sensor data for a single endpoint. */
  async getEndpointSensorData(id: string) {
    return this.request("GET", `/endpoints/${id}/sensor`);
  }

  /** Get sensor data for ALL endpoints in the org. */
  async getBulkSensorData(regionId?: number, locationId?: number) {
    const params = new URLSearchParams();
    if (regionId !== undefined) params.set("regionId", String(regionId));
    if (locationId !== undefined) params.set("locationId", String(locationId));
    const qs = params.toString();
    return this.request("GET", `/endpoints/sensor${qs ? `?${qs}` : ""}`);
  }

  // ── Rooms ────────────────────────────────────────────────────────

  /** List all rooms. */
  async listRooms() {
    return this.request("GET", `/rooms`);
  }

  /** Get a single room. */
  async getRoom(id: string) {
    return this.request("GET", `/rooms/${id}`);
  }

  /** Create a room. */
  async createRoom(data: Record<string, unknown>) {
    return this.request("POST", `/rooms`, data);
  }

  /** Update a room. */
  async updateRoom(id: string, data: Record<string, unknown>) {
    return this.request("PUT", `/rooms/${id}`, data);
  }

  /** Delete a room. */
  async deleteRoom(id: string) {
    return this.request("DELETE", `/rooms/${id}`);
  }

  /** Get sensor data for a room. */
  async getRoomSensorData(id: string) {
    return this.request("GET", `/rooms/${id}/sensor`);
  }

  /** Get bulk sensor data for all rooms. */
  async getBulkRoomSensorData() {
    return this.request("GET", `/rooms/sensor`);
  }

  /** Regenerate a room's DEC (device enrollment code). */
  async regenerateRoomDec(id: string) {
    return this.request("POST", `/rooms/${id}/regenerate-dec`);
  }

  // ── Locations ────────────────────────────────────────────────────

  /** List all locations. */
  async listLocations() {
    return this.request("GET", `/locations`);
  }

  /** Create a location. */
  async createLocation(data: Record<string, unknown>) {
    return this.request("POST", `/locations`, data);
  }

  /** Update a location. */
  async updateLocation(id: number, data: Record<string, unknown>) {
    return this.request("PUT", `/locations/${id}`, data);
  }

  /** Delete a location. */
  async deleteLocation(id: number) {
    return this.request("DELETE", `/locations/${id}`);
  }

  // ── Regions ──────────────────────────────────────────────────────

  /** List all regions. */
  async listRegions() {
    return this.request("GET", `/regions`);
  }

  /** Create a region. */
  async createRegion(data: Record<string, unknown>) {
    return this.request("POST", `/regions`, data);
  }

  /** Update a region. */
  async updateRegion(id: number, data: Record<string, unknown>) {
    return this.request("PUT", `/regions/${id}`, data);
  }

  /** Delete a region. */
  async deleteRegion(id: number) {
    return this.request("DELETE", `/regions/${id}`);
  }

  // ── Profiles ─────────────────────────────────────────────────────

  /** List all Pulse profiles in the org. */
  async listProfiles() {
    return this.request("GET", `/profiles`);
  }

  // ── Audit Logs ───────────────────────────────────────────────────

  /** List audit log entries within a date range. */
  async getAuditLogs(
    from: string,
    to: string,
    pageToken?: string,
    pageSize?: number
  ) {
    const params = new URLSearchParams({ from, to });
    if (pageToken !== undefined) params.set("pageToken", pageToken);
    if (pageSize !== undefined) params.set("pageSize", String(pageSize));
    return this.request("GET", `/audit/logs?${params.toString()}`);
  }

  // ── Bug Reports ──────────────────────────────────────────────────

  /** Generate a bug report for one or more endpoints. */
  async generateBugReport(ids: string[], uploadInCallLogs?: boolean) {
    const params = new URLSearchParams();
    if (uploadInCallLogs !== undefined)
      params.set("uploadInCallLogs", String(uploadInCallLogs));
    const qs = params.toString();
    return this.request(
      "POST",
      `/endpoints/generate_bug_report${qs ? `?${qs}` : ""}`,
      ids
    );
  }

  // ── Room Notes ───────────────────────────────────────────────────

  /** List all notes for a specific room. */
  async listRoomNotes(roomId: string) {
    return this.request("GET", `/rooms/${roomId}/notes`);
  }

  /** Get a specific room note. */
  async getRoomNote(roomId: string, noteId: string) {
    return this.request("GET", `/rooms/${roomId}/notes/${noteId}`);
  }

  /** Create a note for a room. */
  async createRoomNote(roomId: string, content: Record<string, unknown>) {
    return this.request("POST", `/rooms/${roomId}/notes`, content);
  }

  /** Delete a room note. */
  async deleteRoomNote(roomId: string, noteId: string) {
    return this.request("DELETE", `/rooms/${roomId}/notes/${noteId}`);
  }

  /** List all room notes across all rooms in the org. */
  async listAllRoomNotes() {
    return this.request("GET", `/rooms/notes`);
  }

  // ── Users ────────────────────────────────────────────────────────

  /** List all users. */
  async listUsers() {
    return this.request("GET", `/users`);
  }

  /** Get a single user. */
  async getUser(id: string) {
    return this.request("GET", `/users/${id}`);
  }

  /** Create a user. */
  async createUser(data: Record<string, unknown>) {
    return this.request("POST", `/users`, data);
  }

  /** Update a user. */
  async updateUser(id: string, data: Record<string, unknown>) {
    return this.request("PUT", `/users/${id}`, data);
  }

  /** Delete a user. */
  async deleteUser(id: string) {
    return this.request("DELETE", `/users/${id}`);
  }
}
