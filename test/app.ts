import { Koatty, KoattyApplication, KoattyContext, KoattyMetadata, KoattyRouter, KoattyServer } from '../dist/index';


class App extends Koatty implements KoattyApplication {
  ctx: KoattyContext

  server: KoattyServer | KoattyServer[];

  router: KoattyRouter;

  mataData: KoattyMetadata;

  constructor() {
    super();
    this.init();
  }

  public init(): void {
    this.context.get("aa");
    this.context.setMetaData("aa", "bb");
    return;
  }
}

const app = new App();

app.context.throw("", 1, 304)

