import { Memory, MetricsMemory, Subscription } from "../../dts/push";

/**
 * A class for managing subscriptions stored in memory using a Map.
 * Provides methods to retrieve, save, and delete subscriptions.
 *
 * @template T The type of subscription, extending the Subscription interface.
 */
export class PushLocalMemory<T extends Subscription> implements Memory<T> {
    private subscriptions: Map<string, T> = new Map();

    /**
     * Retrieves all subscriptions stored in memory.
     *
     * @returns {Promise<T[]>} A promise that resolves with a list of all subscriptions.
     */
    all(): Promise<T[]> {
        return new Promise((resolve) => setTimeout(() => {
            const list = Array.from(this.subscriptions.entries())
                .map(([id, subscription]) => ({ ...subscription, id }));
            resolve(list);
        }, 1000));
    }

    /**
     * Retrieves a specific subscription by its ID.
     *
     * @param {string} id - The ID of the subscription to retrieve.
     * @returns {Promise<T | undefined>} A promise that resolves with the subscription if found, or undefined if not.
     */
    one(id: string): Promise<T | undefined> {
        return new Promise((resolve) => setTimeout(() => {
            const subscription = this.subscriptions.get(id);
            resolve(subscription);
        }, 1000));
    }

    /**
     * Saves a subscription to memory.
     * If an ID is provided, the subscription is stored under that ID.
     *
     * @param {T} subscription - The subscription to save.
     * @param {string} id - The ID to associate with the subscription.
     * @returns {Promise<void | T>} A promise that resolves when the subscription is saved.
     */
    save(subscription: T, id: string): Promise<void | T> {
        return new Promise((resolve) => setTimeout(() => {
            this.subscriptions.set(id, subscription);
            resolve({ id, ...subscription });
        }, 1000));
    }

    /**
     * Deletes a subscription by its ID.
     *
     * @param {string} id - The ID of the subscription to delete.
     * @returns {Promise<void>} A promise that resolves when the subscription is deleted.
     */
    delete(id: string): Promise<void> {
        return new Promise((resolve) => setTimeout(() => {
            this.subscriptions.delete(id);
            resolve();
        }, 1000));
    }
}

/**
 * A class for managing metrics related to notifications.
 * Tracks successful, failed, and retried notification attempts.
 */
export class MetricsLocalMemory implements MetricsMemory {
    private metrics = {
        successful: 0,
        failed: 0,
        retried: 0,
    };

    /**
     * Increments the specified metric.
     *
     * @param {'successful' | 'failed' | 'retried'} metric - The metric to increment.
     * @returns {Promise<void>} A promise that resolves when the metric is incremented.
     */
    async increment(metric: 'successful' | 'failed' | 'retried'): Promise<void> {
        if (this.metrics[metric] !== undefined) {
            this.metrics[metric]++;
        }
    }

    /**
     * Retrieves the current metrics.
     *
     * @returns {Promise<{ successful: number; failed: number; retried: number }>} A promise that resolves with the current metrics.
     */
    async getMetrics(): Promise<{ successful: number; failed: number; retried: number }> {
        return { ...this.metrics };
    }

    /**
     * Resets all metrics to zero.
     *
     * @returns {Promise<void>} A promise that resolves when the metrics are reset.
     */
    async resetMetrics(): Promise<void> {
        this.metrics = { successful: 0, failed: 0, retried: 0 };
    }
}
