# `serviceWorker` Method Documentation

The `serviceWorker` method registers a Service Worker, manages push notification subscriptions, and returns an event-handling object for a specified channel.

## Method Signature

```typescript
public async serviceWorker<T>({ serviceWorker, channel }: ServiceWorkerLemur<T>): Promise<ChannelLemur<T> | undefined>
```

## Parameters

- **`serviceWorker`** (`ServiceWorkerLemur<T>["serviceWorker"]`):

  - An object that specifies the Service Worker configuration.
  - Types:
    1. `{ path: string, vapidPublicKey: string, options?: RegistrationOptions }`:
       - `path`: Path to the Service Worker file.
       - `vapidPublicKey`: Public key for push notifications.
       - `options`: Optional registration options for the Service Worker.
    2. `{ registration: ServiceWorkerRegistration, vapidPublicKey: string }`:
       - `registration`: An existing Service Worker registration.
       - `vapidPublicKey`: Public key for push notifications.
    3. `PushSubscription`: An existing push notification subscription.

- **`channel`** (`ServiceWorkerLemur<T>["channel"]`):
  - An object that defines the channel configuration.
  - Properties:
    - `name` (`string`): Name of the channel.
    - `opts` (`LemurOpts<T>`): Options for configuring the channel.

## Return Value

- **`Promise<ChannelLemur<T> | undefined>`**:
  - Returns a `ChannelLemur<T>` object for managing events related to the specified channel.
  - Returns `undefined` if the Service Worker or Push Subscription setup fails.

## Steps Performed

1. **Check Browser Support:**

   - Ensures the browser supports Service Workers and the Push API.
   - Logs a warning and exits if not supported.

2. **Handle `serviceWorker` Configuration:**

   - Registers a new Service Worker using the provided `path` and `options`.
   - Uses an existing Service Worker registration if `registration` is provided.
   - Uses an existing `PushSubscription` if `endpoint` is available.

3. **Wait for Service Worker Readiness:**

   - Ensures the Service Worker is fully ready before proceeding.

4. **Subscribe to Push Notifications:**

   - Subscribes to push notifications using the provided `vapidPublicKey`.
   - Validates the subscription before proceeding.

5. **Return Channel Event Handlers:**

   - Provides the following methods for managing the channel:
     - `emit`: Sends data to the channel.
     - `off`: Removes event listeners for the channel.
     - `on`: Registers event listeners for the channel.

6. **Error Handling:**
   - Logs any errors encountered during the process and exits gracefully.

## Example Usage

```typescript
const channel = await webPushLemur.serviceWorker({
  serviceWorker: {
    path: "/sw.js",
    vapidPublicKey: "your-public-vapid-key",
    options: { scope: "/" },
  },
  channel: {
    name: "notifications",
    opts: {
      room: "room-id",
    },
  },
});

if (channel) {
  channel.on();
  channel.emit({ data: { message: "Hello, world!" } });
}
```

## Dependencies

- **Browser APIs:**

  - `navigator.serviceWorker`
  - `PushManager`

- **Custom Methods:**
  - `subscribePush`: Subscribes to push notifications.
  - `emit`: Emits data to the channel.
  - `on`: Registers event listeners.
  - `off`: Removes event listeners.
- **Logger:**
  - Logs warnings, errors, and informational messages.

## Error Handling

- Warns if the browser does not support Service Workers or the Push API.
- Logs errors if Service Worker registration or subscription fails.
