import { LemurSecurity } from '../../src/dts/browser';
import { SocketClient } from '../../src/socketClient';

const setOpt = new SocketClient('').setOpt;

describe('setOpt', () => {
    it('debe agregar el token y apiKey correctamente', () => {
        const security = {
            token: 'abc123',
            apiKey: 'my-api-key',
        };

        const result = setOpt(security);

        expect(result.auth).toEqual({
            authorization: 'Bearer abc123',
            'x-api-key': 'my-api-key',
        });
    });

    it('debe aplicar transformOptions si se proporciona', () => {
        const security = {
            token: 'abc123',
            transformOptions: (auth: Record<string, any>) => ({
                ...auth,
                customField: 'value',
            }),
        };

        const result = setOpt(security);

        expect(result.auth).toEqual({
            authorization: 'Bearer abc123',
            customField: 'value',
        });
    });

    it('debe ignorar transformOptions si no es válida', () => {
        const security: Partial<LemurSecurity> = {
            token: 'abc123',
            transformOptions: () => null as any, // Mal uso
        };

        const result = setOpt(security);

        expect(result.auth).toEqual({
            authorization: 'Bearer abc123',
        });
    });
});
