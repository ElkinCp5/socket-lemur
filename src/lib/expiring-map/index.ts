/**
 * Type definition for the room data.
 *
 * @template T The type of the item stored in the room.
 */
type RoomData<T> = {
    item: T; // The item for the room (could be a set of sockets, data, etc.)
    timestamp: number; // The timestamp in milliseconds when the room was last updated.
};

/**
 * Class to manage a map of rooms that expire after a period of inactivity.
 * This class is generic and can handle any type of item within the room.
 *
 * @template T The type of the item stored in the room.
 * @example
 * // Set the expiration time to 5 minutes (300,000 milliseconds).
 * const rooms = new ExpiringMap<Set<LemurSocket<Session>>>(30 * 60 * 1000);
 *
 * // Add a room with its associated set of sockets (example usage with sockets).
 * rooms.set("room1", new Set<LemurSocket<Session>>());
 *
 * // Access a room (this will update the timestamp).
 * const room1 = rooms.get("room1");
 * if (room1) {
 *   console.log("Room 1 exists and has sockets:", room1);
 * }
 *
 * // Check if a room exists.
 * if (rooms.has("room1")) {
 *   console.log("Room 1 is still active.");
 * }
 *
 * // Manually delete a room.
 * rooms.delete("room1");
 */
export class ExpiringMap<T> {
    private map: Map<string, RoomData<T>>; // Map to store the rooms by their keys.
    private timeout: number; // The expiration time in milliseconds.

    /**
     * Constructor for the ExpiringMap class.
     *
     * @param {number} timeout - The expiration time in milliseconds.
     */
    constructor(timeout?: number) {
        this.map = new Map();
        this.timeout = timeout || (30 * 60 * 1000);
    }

    /**
     * Adds a new room to the map with the current timestamp.
     *
     * @param {string} key - The key (room identifier) for the room.
     * @param {T} item - The item to associate with the room (e.g., a set of sockets).
     */
    set(key: string, item: T): void {
        const timestamp = Date.now(); // Get the current timestamp.
        this.map.set(key, { item, timestamp });
        this.startCleanup(); // Start the cleanup process after adding a room.
    }

    /**
     * Retrieves the item for a room and updates the room's timestamp.
     *
     * @param {string} key - The key (room identifier) of the room to retrieve.
     * @returns {T | undefined} The item for the room, or undefined if the room doesn't exist.
     */
    get(key: string): T | undefined {
        const room = this.map.get(key);
        if (room) {
            room.timestamp = Date.now(); // Update the timestamp when accessing the room.
            return room.item;
        }
        return undefined;
    }

    /**
     * Deletes a room from the map.
     *
     * @param {string} key - The key (room identifier) of the room to delete.
     * @returns {boolean} True if the room was deleted, false otherwise.
     */
    delete(key: string): boolean {
        return this.map.delete(key);
    }

    /**
     * Checks if a room exists in the map.
     *
     * @param {string} key - The key (room identifier) to check.
     * @returns {boolean} True if the room exists, false otherwise.
     */
    has(key: string): boolean {
        return this.map.has(key);
    }

    /**
     * Starts the cleanup process to remove expired rooms after the specified timeout.
     * This will check for expired rooms periodically and delete them from the map.
     */
    private startCleanup(): void {
        setTimeout(() => {
            const now = Date.now();
            for (const [key, room] of this.map.entries()) {
                if (now - room.timestamp > this.timeout) {
                    this.map.delete(key); // Delete rooms that have expired.
                }
            }
        }, this.timeout);
    }

    // Methods for inspection or debugging:

    /**
     * Returns an iterator over the keys of the map.
     *
     * @returns {IterableIterator<string>} An iterator over the keys.
     */
    keys(): IterableIterator<string> {
        return this.map.keys();
    }

    /**
     * Returns an iterator over the values of the map.
     *
     * @returns {IterableIterator<RoomData<T>>} An iterator over the room data values.
     */
    values(): IterableIterator<RoomData<T>> {
        return this.map.values();
    }

    /**
     * Returns an iterator over the entries of the map (key-value pairs).
     *
     * @returns {IterableIterator<[string, RoomData<T>]>} An iterator over the entries.
     */
    entries(): IterableIterator<[string, RoomData<T>]> {
        return this.map.entries();
    }
}