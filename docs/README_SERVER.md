# `channel` y `customChannel`

Los métodos `channel` y `customChannel` permiten configurar canales dentro de la librería LemurSocket para manejar eventos personalizados y soporte opcional para notificaciones web push, soporte de salas y tokens.

---

## Método: `channel`

### Descripción

Configura un canal con opciones flexibles de manejo de eventos, soporte de web push, soporte de salas y autenticación mediante tokens.

### Firmas del Método

#### Sobrecarga 1:

```typescript
public channel<T extends Record<string, any>>(
    name: string,
    onEvent: LemurSimpleWebPushEvent<T & { subscription: Subscription }, Session>,
    pushManager: WebPushLemur<Subscription>
): void;
```

#### Sobrecarga 2:

```typescript
public channel<T extends Record<string, any>>(
    name: string,
    onEvent: LemurSimpleWebPushEvent<T & { subscription: Subscription }, Session>,
    tokenRequired: boolean,
    pushManager: WebPushLemur<Subscription>
): void;
```

#### Sobrecarga 3:

```typescript
public channel<T extends Record<string, any>>(
    name: string,
    onEvent: LemurSimpleEvent<T, Session>,
    tokenRequired?: boolean,
    roomSupport?: boolean
): void;
```

#### Sobrecarga 4:

```typescript
public channel<T extends Record<string, any>>(
    name: string,
    onEvent: LemurSimpleWebPushEvent<T & { subscription: Subscription }, Session>,
    tokenRequired: boolean,
    roomSupport: boolean,
    pushManager: WebPushLemur<Subscription>
): void;
```

### Parámetros

- **`name`** _(string)_: El nombre único del canal.
- **`onEvent`** _(LemurSimpleEvent | LemurSimpleWebPushEvent)_: El manejador del evento para este canal.
- **`tokenRequired`** _(boolean, opcional)_: Indica si el canal requiere autenticación mediante tokens.
- **`roomSupport`** _(boolean, opcional)_: Indica si el canal soporta la funcionalidad de salas.
- **`pushManager`** _(WebPushLemur<Subscription>, opcional)_: Indica si el canal admite notificaciones web push.

### Ejemplos

#### Configurar un canal con soporte de Web Push:

```typescript
lemur.channel(
  "notifications",
  (request, onSuccess, onError, webPush) => {
    webPush.send({ title: "Nueva notificación" });
    onSuccess({ status: "ok" });
  },
  new WebPushLemur()
);
```

#### Configurar un canal con soporte de salas:

```typescript
lemur.channel(
  "chat-room",
  (request, onSuccess, onError) => {
    console.log(`Mensaje recibido en la sala: ${request.room}`);
    onSuccess({ status: "mensaje recibido" });
  },
  true, // tokenRequired
  true // roomSupport
);
```

---

## Método: `customChannel`

### Descripción

Configura un canal personalizado con opciones avanzadas para manejar eventos, incluyendo soporte opcional para notificaciones web push, soporte de salas y autenticación mediante tokens.

### Firmas del Método

#### Sobrecarga 1:

```typescript
public customChannel<T extends Record<string, any>>(
    name: string,
    onEvent: LemurCustomWebPushEvent<T, Session>,
    pushManager: WebPushLemur<Subscription>
): void;
```

#### Sobrecarga 2:

```typescript
public customChannel<T extends Record<string, any>>(
    name: string,
    onEvent: LemurCustomWebPushEvent<T, Session>,
    tokenRequired: boolean,
    pushManager: WebPushLemur<Subscription>
): void;
```

#### Sobrecarga 3:

```typescript
public customChannel<T extends Record<string, any>>(
    name: string,
    onEvent: LemurCustomSimpleEvent<T, Session>,
    tokenRequired?: boolean,
    roomSupport?: boolean
): void;
```

#### Sobrecarga 4:

```typescript
public customChannel<T extends Record<string, any>>(
    name: string,
    onEvent: LemurCustomWebPushEvent<T, Session>,
    tokenRequired: boolean,
    roomSupport: boolean,
    pushManager: WebPushLemur<Subscription>
): void;
```

### Parámetros

- **`name`** _(string)_: El nombre único del canal personalizado.
- **`onEvent`** _(LemurCustomSimpleEvent | LemurCustomWebPushEvent)_: El manejador del evento personalizado para este canal.
- **`tokenRequired`** _(boolean, opcional)_: Indica si el canal requiere autenticación mediante tokens.
- **`roomSupport`** _(boolean, opcional)_: Indica si el canal soporta la funcionalidad de salas.
- **`pushManager`** _(WebPushLemur<Subscription>, opcional)_: Indica si el canal admite notificaciones web push.

### Ejemplos

#### Configurar un canal personalizado con Web Push:

```typescript
lemur.customChannel(
  "alerts",
  (request, socket, error, webPush) => {
    webPush.send({ title: "Alerta importante" });
    socket.emit("alert-confirmation", { status: "sent" });
  },
  new WebPushLemur()
);
```

#### Configurar un canal personalizado con soporte de salas y token:

```typescript
lemur.customChannel(
  "secure-chat",
  (request, socket, error) => {
    console.log(`Evento recibido en el canal seguro: ${request.room}`);
    socket.to(request.room, { message: "Mensaje recibido" });
  },
  true, // tokenRequired
  true // roomSupport
);
```
