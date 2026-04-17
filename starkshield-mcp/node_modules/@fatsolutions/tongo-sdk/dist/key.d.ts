export declare function ECDiffieHellman(secret: bigint, otherPublicKey: string): Uint8Array<ArrayBufferLike>;
export declare function buildInfo(tongoAddress: string): Uint8Array;
export declare function buildSalt(nonce: bigint, sharedSecret: Uint8Array): Uint8Array;
export declare function deriveSymmetricEncryptionKey(deriveSymKeyParams: {
    secret: Uint8Array;
    nonce: bigint;
    contractAddress: string;
}): Promise<Uint8Array<ArrayBufferLike>>;
