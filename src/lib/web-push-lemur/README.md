# Web-Push-Lemur Documentation

`WebPushLemur` is a powerful and flexible library for managing push notifications using the Web Push API. It provides mechanisms for subscription management, sending notifications, retrying failed notifications, and tracking the success, failure, and retries of notifications through metrics. It integrates with custom memory systems for storing subscriptions and an optional logger for better observability.

## Features

- **Subscription Management**: Add, delete, and retrieve subscriptions from memory.
- **Push Notifications**: Send push notifications to all or specific subscribers.
- **Retries for Failed Notifications**: Automatically retry sending notifications on failure.
- **Metrics Tracking**: Track the success, failure, and retry metrics of notifications.
- **Customizable Settings**: Configure settings like VAPID keys and retry logic.
- **Logger Integration**: Log actions for better monitoring and debugging.

## Installation

Ensure you have the necessary dependencies for Web Push notifications and a logger system (like Winston or a custom logger) installed.

```bash
npm install web-push-lemur
```

## Simple setup

```typescript
import { WebPushLemur } from "web-push-lemur";

const webPushLemur = new WebPushLemur<Subscription>({
  vapidPublicKey: "your-vapid-public-key",
  vapidPrivateKey: "your-vapid-private-key",
  email: "your-email@example.com",
  retrySend: {
    retries: 3,
    delay: 2000,
  },
});

// Add a subscription
const subscription: Subscription = { ... }; // Example subscription object
await webPushLemur.add('user-id', subscription);

// Send notification to all subscribers
await webPushLemur.sendNotificationToAll({ title: 'Hello', message: 'World' });

// Send notification to a specific subscriber
await webPushLemur.sendNotificationToOne('user-id', { title: 'Hello', message: 'Specific User' });

```
