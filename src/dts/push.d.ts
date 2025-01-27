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
 * Interface que representa las opciones para mostrar una notificación push en un navegador.
 * Esta interfaz está basada en las recomendaciones del artículo de web.dev sobre notificaciones push.
 *
 * La notificación puede contener opciones adicionales como acciones, iconos, y texto,
 * e incluso permite manejar respuestas inline (respuestas rápidas) desde la propia notificación.
 * @example https://web.dev/articles/push-notifications-display-a-notification?hl=es-419
 */
export declare interface Payload {
    /**
     * El título de la notificación.
     * Este campo es obligatorio y representa el título principal que se mostrará en la notificación.
     *
     * @example "¡Nuevo mensaje!"
     */
    title: string;

    /**
     * El cuerpo de la notificación.
     * Este campo es opcional y contiene el mensaje secundario que se mostrará debajo del título.
     *
     * @example "Tienes un nuevo mensaje en tu bandeja de entrada."
     */
    body?: string;

    /**
     * El icono que se mostrará junto a la notificación.
     * Este campo es opcional y puede ser una URL de una imagen.
     *
     * @example "https://example.com/icon.png"
     */
    icon?: string;

    /**
     * El badge de la notificación.
     * Este es un pequeño icono que se muestra junto a la notificación para indicar una acción,
     * similar a un distintivo o medalla.
     *
     * @example "https://example.com/badge.png"
     */
    badge?: string;

    /**
     * El sonido que se reproducirá cuando se reciba la notificación.
     * Este campo es opcional y puede ser una URL que apunte al archivo de audio a reproducir.
     *
     * @example "https://example.com/sound.mp3"
     */
    sound?: string;

    /**
     * La URL a la que debe redirigir el usuario cuando haga clic en la notificación.
     * Este campo es opcional y debe ser una URL válida.
     *
     * @example "https://example.com"
     */
    url?: string;

    /**
     * Tiempo de expiración de la notificación.
     * Si se establece, la notificación se elimina automáticamente después de este tiempo.
     * El valor debe estar en milisegundos.
     *
     * @example 5000 // La notificación expirará después de 5 segundos.
     */
    expireTime?: number;

    /**
     * Acciones que se pueden realizar directamente desde la notificación.
     * Las acciones son botones que el usuario puede pulsar para interactuar con la notificación.
     * Este campo es opcional y debe ser un array de objetos de acción.
     *
     * @example [
     *   {
     *     action: "reply",
     *     title: "Responder",
     *     icon: "https://example.com/reply-icon.png"
     *   }
     * ]
     */
    actions?: NotificationAction[];

    /**
     * Configuración adicional para mostrar respuestas inline (respuestas rápidas) dentro de la notificación.
     * Este campo es opcional y permite definir una respuesta que el usuario puede escribir directamente en la notificación.
     *
     * @example {
     *   placeholder: "Escribe tu respuesta",
     *   type: "text"
     * }
     */
    reply?: NotificationReply;
}

/**
 * Interfaz que define una acción que el usuario puede realizar en una notificación.
 * Una acción es un botón en la notificación que puede ejecutar un evento cuando el usuario interactúa con ella.
 */
export declare interface NotificationAction {
    /**
     * El identificador único de la acción.
     * Este campo es obligatorio y se utiliza para identificar la acción cuando el usuario la selecciona.
     *
     * @example "reply"
     */
    action: string;

    /**
     * El título que se muestra en el botón de la acción.
     * Este campo es obligatorio y representa el texto que aparecerá en el botón de la acción.
     *
     * @example "Responder"
     */
    title: string;

    /**
     * El icono que se mostrará en el botón de la acción.
     * Este campo es opcional y puede ser una URL que apunte a la imagen del icono.
     *
     * @example "https://example.com/reply-icon.png"
     */
    icon?: string;

    /**
     * El tipo de acción que se ejecutará cuando el usuario haga clic en el botón.
     * Esto puede ser un evento personalizado o una acción predeterminada.
     *
     * @example "click"
     */
    type?: "click" | "custom";
}

/**
 * Interfaz que define la configuración para permitir respuestas inline (respuestas rápidas) dentro de la notificación.
 */
export interface NotificationReply {
    /**
     * El texto que se mostrará como un marcador de posición dentro del campo de respuesta.
     * Este campo es obligatorio y define el texto inicial que aparece en el cuadro de respuesta.
     *
     * @example "Escribe tu respuesta"
     */
    placeholder: string;

    /**
     * El tipo de entrada que se utilizará para la respuesta.
     * Este campo es obligatorio y puede ser "text", "email", "url", etc.
     *
     * @example "text"
     */
    type: "text" | "email" | "url";
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
