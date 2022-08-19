export abstract class URL {
  public abstract readonly scheme: string;

  public abstract toString(): string;
}

export class UnrecognizedURL extends URL {
  public constructor(public readonly scheme: string, public readonly fullURL: string) {
    super();
  }

  public toString() {
    return this.fullURL;
  }
}

export abstract class FarcasterURL extends URL {
  public static readonly SCHEME = 'farcaster';
  public readonly scheme = FarcasterURL.SCHEME;
}
