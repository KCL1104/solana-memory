/**
 * Type declarations for tweetnacl
 */

declare module 'tweetnacl' {
  export interface KeyPair {
    publicKey: Uint8Array;
    secretKey: Uint8Array;
  }

  export interface BoxKeyPair {
    publicKey: Uint8Array;
    secretKey: Uint8Array;
  }

  export namespace sign {
    export function keyPair(): KeyPair;
    export namespace keyPair {
      export function fromSecretKey(secretKey: Uint8Array): KeyPair;
    }
    export function detached(
      message: Uint8Array,
      secretKey: Uint8Array
    ): Uint8Array;
    namespace detached {
      export function verify(
        message: Uint8Array,
        signature: Uint8Array,
        publicKey: Uint8Array
      ): boolean;
    }
  }

  export namespace box {
    export function keyPair(): BoxKeyPair;
  }
}
