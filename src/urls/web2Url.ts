import { URL } from '~/urls/baseUrl';

export class Web2URL extends URL {
  public static readonly HTTP_SCHEME = 'http';
  public static readonly HTTPS_SCHEME = 'https';

  public constructor(public readonly scheme: string, public readonly fullURL: string) {
    super();
  }

  public toString() {
    return this.fullURL;
  }
}
