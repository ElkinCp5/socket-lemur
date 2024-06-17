## system router

```typescript
// feature/response-experiment:v0.1.0

// FEATURES

// types olds - client
interface OpsSecurity {
  apiKey?: string;
  token?: string;
}
type OnSuccessCallback<T = any> = (data: T) => void;
type OnErrorCallback = (error: any) => void;
type EmitEvent<T> = (data: T | undefined, security?: OpsSecurity) => void;

// types olds - server
type Socket<T extends any> = SocketIORequestServer<any, any, any, any, T>;
type Next = (err?: any | undefined) => void;
type OnSuccess = (data: any) => void;
type OnEvent<T, S> = (
  data: T,
  session: S | undefined,
  onSuccess: OnSuccess
) => void;

// types new

declare type LemurSocket<T extends any> = Socket<any, any, any, any, T>;
declare type LemurSecurity = { apiKey?: string; token?: string };
declare type LemurRequest<T, S> = {
  session: S | undefined;
  params: Record<string, any>;
  body: T;
};
declare type LemurData<T> = {
  params?: Record<string, any>;
  data: T;
};
declare type LemurNext = (err?: any | undefined) => void;
declare type LemurResponse = (data: any) => void;
declare type LemurEvent<T, S> = (
  request: LemurRequest<T, S>,
  response: LemurResponse
) => void;
declare type LemurEmit<T> = (
  data: LemurData<T> | undefined,
  security?: OpsSecurity
) => void;

declare type OnSuccessCallback<T = any> = (data: T) => void;
declare type OnErrorCallback = (error: any) => void;

// method
```
