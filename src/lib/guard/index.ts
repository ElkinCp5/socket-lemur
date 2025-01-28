import { LemurCustomSimpleEvent, LemurCustomWebPushEvent, LemurEvent, LemurSimpleEvent, LemurSimpleWebPushEvent } from "../../dts/browser";
import { Subscription } from "../../dts/push";
import { WebPushLemur } from "../web-push-lemur";

export function isLemurCustomSimpleEvent<T, S>(
    event: LemurEvent<T, S>
): event is LemurCustomSimpleEvent<T, S> {
    return event.length === 3; // Tiene tres argumentos: request, socket, error
}

export function isLemurCustomWebPushEvent<T, S>(
    event: LemurEvent<T, S>
): event is LemurCustomWebPushEvent<T, S> {
    return event.length === 4; // Tiene cuatro argumentos: request, socket, error, webPush
}

export function isLemurSimpleEvent<T, S>(
    event: LemurEvent<T, S>
): event is LemurSimpleEvent<T, S> {
    return event.length === 3; // Tiene tres argumentos: request, onSuccess, onError
}

export function isLemurSimpleWebPushEvent<T, S>(
    event: LemurEvent<T, S>
): event is LemurSimpleWebPushEvent<T, S> {
    return event.length === 4; // Tiene cuatro argumentos: request, onSuccess, onError, webPush
}

export function isWebPushLemur(
    event: WebPushLemur<Subscription>
): event is WebPushLemur<Subscription> {
    return typeof event.sendNotificationToAll === 'function'
        && typeof event.sendNotificationToOne === 'function'
        && typeof event.add === 'function'
        && typeof event.delete === 'function'
        && typeof event.send === 'function'
        && typeof event.getSubscriptions === 'function'
        && typeof event.getMetrics === 'function';
}
