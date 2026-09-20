export const decodeVapidPublicKey = (base64Url: string): Uint8Array<ArrayBuffer> => {
    const base64 = base64Url.replaceAll('-', '+').replaceAll('_', '/');
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');

    return Uint8Array.from(atob(padded), (char) => {
        return char.codePointAt(0) ?? 0;
    });
};
