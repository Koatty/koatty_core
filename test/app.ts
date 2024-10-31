import { Koatty } from '../dist/index';


class App extends Koatty {
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