/**
 * Represents a subscription object with an endpoint and keys for authentication.
 */
export declare interface Subscription {
    /**
     * The endpoint URL for the subscription.
     */
    endpoint: string;

    /**
     * Keys used for encryption and authentication.
     */
    keys: {
        /**
         * Public key for encryption.
         */
        p256dh: string;

        /**
         * Authentication key.
         */
        auth: string;
    };

    /**
     * Additional properties for the subscription.
     */
    [key: string]: any;
}

/**
 * Configuration settings for the notification system.
 */
export declare interface Settings {
    /**
     * The public VAPID key for push notifications.
     */
    vapidPublicKey: string;

    /**
     * The private VAPID key for push notifications.
     */
    vapidPrivateKey: string;

    /**
     * The email address used for VAPID identification.
     */
    email: string;

    /**
     * Optional settings for retrying failed notifications.
     */
    retrySend?: {
        /**
         * Number of retry attempts.
         */
        retries: number;

        /**
         * Optional delay (in milliseconds) between retries.
         */
        delay?: number;
    };
}

/**
 * Represents the payload of a notification.
 */
export declare interface Payload {
    /**
     * The title of the notification.
     */
    title: string;

    /**
     * An optional subtitle for the notification.
     */
    subTitle?: string;

    /**
     * A description of the notification content.
     */
    descrition?: string;

    /**
     * An optional URL or path to the notification icon.
     */
    icon?: string;

    /**
     * Additional properties for the notification payload.
     */
    [key: string]: any;
}

/**
 * Interface for managing metrics related to notifications.
 */
export interface MetricsMemory {
    /**
     * Increments a specified metric.
     *
     * @param {('successful' | 'failed' | 'retried')} metric - The metric to increment.
     * @returns {Promise<void>} A promise that resolves when the metric is incremented.
     */
    increment(metric: 'successful' | 'failed' | 'retried'): Promise<void>;

    /**
     * Retrieves the current metrics.
     *
     * @returns {Promise<{ successful: number; failed: number; retried: number }>} A promise that resolves with the metrics.
     */
    getMetrics(): Promise<{ successful: number; failed: number; retried: number }>;

    /**
     * Resets all metrics to their initial values.
     *
     * @returns {Promise<void>} A promise that resolves when the metrics are reset.
     */
    resetMetrics(): Promise<void>;
}

/**
 * Generic interface for managing in-memory storage of subscriptions.
 *
 * @template T The type of subscription being managed.
 */
export interface Memory<T> {
    /**
     * Retrieves all stored subscriptions.
     *
     * @returns {Promise<T[]>} A promise that resolves with an array of subscriptions.
     */
    all(): Promise<T[]>;

    /**
     * Retrieves a specific subscription by its ID.
     *
     * @param {string} id - The ID of the subscription to retrieve.
     * @returns {Promise<T | undefined>} A promise that resolves with the subscription or undefined if not found.
     */
    one(id: string): Promise<T | undefined>;

    /**
     * Saves a subscription to memory.
     *
     * @param {T} subscription - The subscription to save.
     * @param {string} [id] - Optional ID to associate with the subscription.
     * @returns {Promise<void | T>} A promise that resolves when the subscription is saved.
     */
    save(subscription: T, id?: string): Promise<void | T>;

    /**
     * Deletes a subscription by its ID.
     *
     * @param {string} id - The ID of the subscription to delete.
     * @returns {Promise<void | T>} A promise that resolves when the subscription is deleted.
     */
    delete(id: string): Promise<void | T>;
}

/**
 * Defines possible key types for identifying subscriptions.
 */
export declare type Keys = "id" | "uuid" | "_id" | string;
