import nacl from 'tweetnacl';
import util from 'tweetnacl-util';

/**
 * @file SessionKeyManager.ts
 * @description Ed25519-based cryptographic session engine for ION DEX.
 * Enables "Auto-Sign" high-frequency trading by delegating signature authority
 * to a local ephemeral keypair authorized by the main wallet.
 */

export interface SessionData {
  publicKeyBase64: string;
  secretKeyBase64: string;
  expiryAt: number;
}

export class SessionKeyManager {
  private static STORAGE_KEY = 'ion_pro_session_key';
  private static SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24-hour validity

  /**
   * 1. Local Key Generation & Persistence
   */
  static getOrGenerateKey(): SessionData {
    const existingStr = localStorage.getItem(this.STORAGE_KEY);
    
    if (existingStr) {
      const sessionData: SessionData = JSON.parse(existingStr);
      if (Date.now() < sessionData.expiryAt) {
        return sessionData;
      }
      console.warn("[SessionKey] Key expired. Generating a new one.");
    }

    // Generate a new Ed25519 keypair for high-speed local signing
    const keyPair = nacl.sign.keyPair();
    const newSession: SessionData = {
      publicKeyBase64: util.encodeBase64(keyPair.publicKey),
      secretKeyBase64: util.encodeBase64(keyPair.secretKey),
      expiryAt: Date.now() + this.SESSION_DURATION_MS,
    };

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newSession));
    return newSession;
  }

  /**
   * 2. Main Wallet On-Chain Authorization
   */
  static async authorizeOnChain(tonConnectUI: any, routerContractAddress: string) {
    const session = this.getOrGenerateKey();
    
    console.log("[SessionKey] Requesting main wallet approval for Public Key:", session.publicKeyBase64);

    const authTransaction = {
      validUntil: Math.floor(Date.now() / 1000) + 60,
      messages: [
        {
          address: routerContractAddress,
          amount: "50000000", // 0.05 ION for forward_fee and storage
          payload: "te6cckEBAQEAAgAAAEysqw==", // Serialized BOC for RegisterSessionKey
        }
      ]
    };

    try {
      await tonConnectUI.sendTransaction(authTransaction);
      console.log("[SessionKey] Authorization Tx broadcasted!");
      return true;
    } catch (error) {
      console.error("[SessionKey] User rejected authorization.", error);
      return false;
    }
  }

  /**
   * 3. Zero-Friction Silent Signing
   */
  static signTradeRequest(tradeParams: Record<string, any>) {
    const session = this.getOrGenerateKey();
    
    if (Date.now() > session.expiryAt) {
      throw new Error("PRO Session Expired. Please re-authorize.");
    }

    // Standardize serialization order for deterministic signatures
    const messageStr = JSON.stringify(tradeParams, Object.keys(tradeParams).sort());
    const messageUint8 = util.decodeUTF8(messageStr);
    
    const secretKeyUint8 = util.decodeBase64(session.secretKeyBase64);

    // Ed25519 local signature (< 1ms)
    const signatureUint8 = nacl.sign.detached(messageUint8, secretKeyUint8);

    return {
      ...tradeParams,
      auth: {
        sessionPubKey: session.publicKeyBase64,
        signature: util.encodeBase64(signatureUint8),
        timestamp: Date.now()
      }
    };
  }

  static destroySession() {
    localStorage.removeItem(this.STORAGE_KEY);
    console.log("[SessionKey] Local keys destroyed.");
  }
}
