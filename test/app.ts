import { Koatty, KoattyContext, KoattyMetadata, KoattyRouter, KoattyServer } from '../src/index';


export class App extends Koatty {
  ctx: KoattyContext

  server: KoattyServer;

  router: KoattyRouter;

  mataData: KoattyMetadata;

  constructor() {
    super();
    this.init();
  }

  public init(): void {
    this.setMetaData("aa", "bb");
    return;
  }
}


