import webPush from 'web-push';
import { Logger } from '../logger';
import { MetricsLocalMemory, PushLocalMemory } from './memory';
import type { Keys, Memory, MetricsMemory, Payload, Settings, Subscription } from '../../dts/push';
import type { LoggerSystem } from '../../dts/logger';

/**
 * Class for managing Web Push notifications with support for subscriptions, metrics, and logging.
 * Provides functionality to add, delete, and send notifications to all or a single subscription.
 */
export class WebPushLemur<T extends Subscription & Record<string, any>> {
    /**
     * Creates an instance of WebPushLemur.
     *
     * @param {Settings} settings - Configuration settings for Web Push notifications.
     * @param {Memory<T>} memory - In-memory storage for managing subscriptions.
     * @param {MetricsMemory} metricsMemory - In-memory storage for managing metrics.
     * @param {LoggerSystem} logger - Logger system used for logging notifications and errors.
     */
    constructor(
        private readonly settings: Settings,
        private readonly key: Keys = "id",
        private readonly memory: Memory<T> = new PushLocalMemory(),
        private readonly metricsMemory: MetricsMemory = new MetricsLocalMemory(),
        private readonly logger: LoggerSystem = new Logger("logger-console"),
    ) {
        webPush.setVapidDetails(
            `mailto:${this.settings.email}`,
            this.settings.vapidPublicKey,
            this.settings.vapidPrivateKey
        );
    }

    /**
     * Adds a new subscription to memory.
     *
     * @param {string} id - The unique identifier for the subscription.
     * @param {T} subscription - The subscription object to add.
     * @returns {Promise<void | T>} A promise that resolves when the subscription is saved.
     */
    public async add(id: string, subscription: T): Promise<void | T> {
        return await this.memory.save(subscription, id);
    }

    /**
     * Deletes a subscription from memory by its ID.
     *
     * @param {string} id - The unique identifier of the subscription to delete.
     * @returns {Promise<void | T>} A promise that resolves when the subscription is deleted.
     */
    public async delete(id: string): Promise<void | T> {
        return await this.memory.delete(id);
    }

    /**
     * Sends a notification to all subscriptions stored in memory.
     *
     * @param {Payload} payload - The content of the notification.
     * @param {Keys} key - The key used to identify subscriptions (default is "id").
     * @returns {Promise<void>} A promise that resolves when all notifications are sent.
     */
    public async sendNotificationToAll(payload: Payload, key: Keys = this.key): Promise<void> {
        const subscriptions = await this.memory.all();

        await Promise.allSettled(
            subscriptions.map(subscription => this.send(subscription, payload, key))
        );
    }

    /**
     * Sends a notification to a single subscription identified by its ID.
     *
     * @param {string} id - The unique identifier for the subscription.
     * @param {Payload} payload - The content of the notification.
     * @param {Keys} key - The key used to identify subscriptions (default is "id").
     * @returns {Promise<void>} A promise that resolves when the notification is sent.
     */
    public async sendNotificationToOne(id: string, payload: Payload, key: Keys = this.key): Promise<void> {
        const subscription = await this.memory.one(id);

        if (!subscription) {
            return await this.logger.error(`No subscription found for ID: ${id}`);
        }
        await this.send(subscription, payload, key);
    }

    /**
     * Sends a notification to a single subscription and handles errors or retries.
     *
     * @param {Subscription} subscription - The subscription to send the notification to.
     * @param {Payload} payload - The content of the notification.
     * @param {Keys} key - The key used to identify subscriptions (default is "id").
     * @returns {Promise<void>} A promise that resolves when the notification is sent.
     */
    public async send(subscription: Subscription, payload: Payload, key: Keys = this.key): Promise<void> {
        try {
            this.validateSubscription(subscription); // Validate the subscription
            const payloadString = JSON.stringify(payload);

            await webPush.sendNotification(subscription, payloadString);
            await this.logger.info(`Notification sent to ${subscription[key]}`, { payload });
            await this.metricsMemory.increment('successful'); // Update metrics
        } catch (error: any) {
            await this.logger.error(`Error sending notification to ${subscription[key]}`, error);

            if (error?.statusCode === 410) {
                await this.delete(subscription[key]); // Remove invalid subscriptions
            } else {
                await this.retrySend(subscription, payload, key); // Retry on error
            }

            await this.metricsMemory.increment('failed'); // Update metrics
        }
    }

    /**
     * Retrieves all subscriptions stored in memory.
     *
     * @returns {Promise<T[]>} A promise that resolves with an array of all subscriptions.
     */
    public async getSubscriptions(): Promise<T[]> {
        return await this.memory.all();
    }

    /**
     * Retrieves the current metrics for notification successes, failures, and retries.
     *
     * @returns {Promise<{ successful: number; failed: number; retried: number }>} A promise that resolves with the metrics.
     */
    public async getMetrics(): Promise<{ successful: number; failed: number; retried: number; }> {
        return await this.metricsMemory.getMetrics(); // Get metrics from memory
    }

    /**
     * Retries sending a notification a specified number of times in case of failure.
     *
     * @param {Subscription} subscription - The subscription to send the notification to.
     * @param {Payload} payload - The content of the notification.
     * @param {Keys} key - The key used to identify subscriptions (default is "id").
     * @param {number} retries - The number of retry attempts (default is 3).
     * @param {number} delay - The delay between retry attempts in milliseconds (default is 2000ms).
     * @returns {Promise<void>} A promise that resolves when the notification is successfully sent or retries are exhausted.
     */
    private async retrySend(
        subscription: Subscription,
        payload: Payload,
        key: Keys = this.key,
        retries: number = this.settings?.retrySend?.retries || 3,
        delay: number = this.settings?.retrySend?.delay || 2000
    ): Promise<void> {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                await this.send(subscription, payload, key);
                await this.metricsMemory.increment('retried'); // Update metrics
                return;
            } catch (error) {
                if (attempt === retries) {
                    return;
                }
                await this.sleep(delay);
            }
        }
    }

    /**
     * Pauses execution for a specified number of milliseconds.
     *
     * @param {number} ms - The number of milliseconds to wait.
     * @returns {Promise<void>} A promise that resolves after the specified delay.
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Validates a subscription object to ensure it has the required properties.
     *
     * @param {Subscription} subscription - The subscription to validate.
     * @throws {Error} Throws an error if the subscription is invalid.
     */
    private validateSubscription(subscription: Subscription): void {
        if (!subscription.endpoint || typeof subscription.endpoint !== "string") {
            throw new Error("Invalid subscription: 'endpoint' is required and must be a string.");
        }
        if (!subscription.keys || typeof subscription.keys.p256dh !== "string" || typeof subscription.keys.auth !== "string") {
            throw new Error("Invalid subscription: 'keys.p256dh' and 'keys.auth' are required and must be strings.");
        }
    }
}
