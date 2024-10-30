import { Koatty } from '../src/Application';


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