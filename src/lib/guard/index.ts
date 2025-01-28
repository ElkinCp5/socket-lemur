import type { LemurCustomSimpleEvent, LemurCustomWebPushEvent, LemurEvent, LemurSimpleEvent, LemurSimpleWebPushEvent } from "../../dts/browser";
import { WebPushLemur } from "../web-push-lemur";

export function isLemurCustomSimpleEvent<T, S>(
    type: string,
    event: LemurEvent<T, S>
): event is LemurCustomSimpleEvent<T, S> {
    return type === 'custom' && event.length >= 1;
}

export function isLemurCustomWebPushEvent<T, S>(
    type: string,
    event: LemurEvent<T, S>
): event is LemurCustomWebPushEvent<T, S> {
    return type === 'custom' && event.length >= 1;
}

export function isLemurSimpleEvent<T, S>(
    type: string,
    event: LemurEvent<T, S>
): event is LemurSimpleEvent<T, S> {
    return type === 'simple' && event.length >= 1;
}

export function isLemurSimpleWebPushEvent<T, S>(
    type: string,
    event: LemurEvent<T, S>
): event is LemurSimpleWebPushEvent<T, S> {
    return type === 'simple' && event.length >= 1;
}

export function isWebPushLemur(
    event?: any
): event is WebPushLemur<any> {
    if (!event) return false;
    return typeof event?.sendNotificationToAll === 'function'
        && typeof event?.sendNotificationToOne === 'function'
        && typeof event?.add === 'function'
        && typeof event?.delete === 'function'
        && typeof event?.send === 'function'
        && typeof event?.getSubscriptions === 'function'
        && typeof event?.getMetrics === 'function';
}
