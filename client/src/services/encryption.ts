import * as openpgp from 'openpgp';

export interface KeyPair {
  publicKey: string;
  privateKey: string;
  fingerprint: string;
}

export class EncryptionService {
  private static instance: EncryptionService;
  private keyPair: KeyPair | null = null;

  private constructor() {}

  static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  async generateKeyPair(username: string, passphrase: string): Promise<KeyPair> {
    const { privateKey, publicKey } = await openpgp.generateKey({
      type: 'ecc',
      curve: 'curve25519Legacy',
      userIDs: [{ name: username }],
      passphrase,
    });

    const publicKeyObj = await openpgp.readKey({ armoredKey: publicKey });
    const fingerprint = publicKeyObj.getFingerprint().toUpperCase();

    this.keyPair = {
      publicKey,
      privateKey,
      fingerprint: `${fingerprint.slice(0, 4)} ${fingerprint.slice(4, 8)} ${fingerprint.slice(8, 12)} ${fingerprint.slice(12, 16)}`,
    };

    return this.keyPair;
  }

  async loadKeyPair(privateKeyArmored: string, passphrase: string): Promise<KeyPair> {
    const privateKey = await openpgp.decryptKey({
      privateKey: await openpgp.readPrivateKey({ armoredKey: privateKeyArmored }),
      passphrase,
    });

    const publicKey = privateKey.toPublic().armor();
    const fingerprint = privateKey.getFingerprint().toUpperCase();

    this.keyPair = {
      publicKey,
      privateKey: privateKeyArmored,
      fingerprint: `${fingerprint.slice(0, 4)} ${fingerprint.slice(4, 8)} ${fingerprint.slice(8, 12)} ${fingerprint.slice(12, 16)}`,
    };

    return this.keyPair;
  }

  getKeyPair(): KeyPair | null {
    return this.keyPair;
  }

  async encryptMessage(message: string, recipientPublicKeyArmored: string): Promise<string> {
    if (!this.keyPair) {
      throw new Error('No key pair loaded');
    }

    const recipientKey = await openpgp.readKey({ armoredKey: recipientPublicKeyArmored });

    const encrypted = await openpgp.encrypt({
      message: await openpgp.createMessage({ text: message }),
      encryptionKeys: recipientKey,
      signingKeys: await openpgp.readPrivateKey({ armoredKey: this.keyPair.privateKey }),
    });

    return encrypted;
  }

  async decryptMessage(encryptedMessage: string, senderPublicKeyArmored?: string): Promise<string> {
    if (!this.keyPair) {
      throw new Error('No key pair loaded');
    }

    const privateKey = await openpgp.readPrivateKey({ armoredKey: this.keyPair.privateKey });

    const message = await openpgp.readMessage({ armoredMessage: encryptedMessage });

    const decryptOptions: openpgp.DecryptOptions = {
      message,
      decryptionKeys: privateKey,
    };

    if (senderPublicKeyArmored) {
      decryptOptions.verificationKeys = await openpgp.readKey({ armoredKey: senderPublicKeyArmored });
    }

    const { data, signatures } = await openpgp.decrypt(decryptOptions);

    // Verify signature if sender key provided
    if (signatures && senderPublicKeyArmored) {
      try {
        await signatures[0].verified;
      } catch (e) {
        console.warn('Signature verification failed:', e);
      }
    }

    return data as string;
  }

  async encryptGroupMessage(message: string, recipientPublicKeys: string[]): Promise<string> {
    if (!this.keyPair) {
      throw new Error('No key pair loaded');
    }

    const encryptionKeys = await Promise.all(
      recipientPublicKeys.map((key) => openpgp.readKey({ armoredKey: key }))
    );

    const encrypted = await openpgp.encrypt({
      message: await openpgp.createMessage({ text: message }),
      encryptionKeys,
      signingKeys: await openpgp.readPrivateKey({ armoredKey: this.keyPair.privateKey }),
    });

    return encrypted;
  }

  getFingerprint(): string | null {
    return this.keyPair?.fingerprint || null;
  }

  getPublicKey(): string | null {
    return this.keyPair?.publicKey || null;
  }
}

export const encryptionService = EncryptionService.getInstance();
