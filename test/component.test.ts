import "reflect-metadata";
import { Aspect, IAspect } from "koatty_container";
import {
  Component, Controller, GrpcController, WebSocketController, GraphQLController,
  Middleware, Service, Plugin, implementsMiddlewareInterface, implementsControllerInterface,
  implementsServiceInterface, implementsPluginInterface, implementsAspectInterface,
  IMiddleware, IController, IService, IPlugin
} from "../src/Component";
import { IOC } from "koatty_container";
import { KoattyApplication } from "../src/IApplication";
import { KoattyContext } from "../src/IContext";

// Mock KoattyApplication
const mockApp: Partial<KoattyApplication> = {
  env: "test",
  name: "TestApp",
  version: "1.0.0"
};

// Mock KoattyContext
const mockCtx: Partial<KoattyContext> = {
  app: mockApp as KoattyApplication
};

// Define test classes outside describe so they can be registered in beforeEach
@Component()
class TestComponent { }

@Middleware()
class TestMiddleware implements IMiddleware {
  run(options: any, app: KoattyApplication) {
    return async (ctx: KoattyContext, next: () => Promise<any>) => {
      return next();
    };
  }
}

@Controller()
class TestController implements IController {
  app: KoattyApplication = mockApp as KoattyApplication;
  ctx: KoattyContext = mockCtx as KoattyContext;
}

@GrpcController("/grpc")
class GrpcTestController implements IController {
  app: KoattyApplication = mockApp as KoattyApplication;
  ctx: KoattyContext = mockCtx as KoattyContext;
}

@WebSocketController("/ws")
class WsTestController implements IController {
  app: KoattyApplication = mockApp as KoattyApplication;
  ctx: KoattyContext = mockCtx as KoattyContext;
}

@GraphQLController("/graphql")
class GraphQLTestController implements IController {
  app: KoattyApplication = mockApp as KoattyApplication;
  ctx: KoattyContext = mockCtx as KoattyContext;
}

@Service()
class TestService implements IService {
  app: KoattyApplication = mockApp as KoattyApplication;
}

@Plugin()
class TestPlugin implements IPlugin {
  run() { return Promise.resolve(); }
}

@Aspect()
class TestAspect implements IAspect {
  app: KoattyApplication = mockApp as KoattyApplication;
  run() { return Promise.resolve(); }
}

describe("Component Decorators", () => {
  beforeEach(() => {
    // Reset IOC container before each test
    IOC.clear();
    IOC.setApp(mockApp as KoattyApplication);
    // IOC.reg("TestAspect", TestAspect);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("@Component", () => {
    it("should register class with default identifier", () => {
      IOC.reg("TestComponent", TestComponent);
      const components = IOC.get("TestComponent") as Record<string, any>;
      expect(components).toBeDefined();
      expect(components).toHaveProperty("app");
      expect(components).toBeInstanceOf(TestComponent);
    });

    it("should register class with custom identifier", () => {
      IOC.reg("CustomName", TestComponent);
      const components = IOC.get("CustomName") as Record<string, any>;
      expect(components).toBeDefined();
      expect(components).toHaveProperty("app");
      expect(components).toBeInstanceOf(TestComponent);
    });
  });

  describe("@Controller", () => {
    it("should register controller with default options", () => {
      IOC.reg("TestController", TestController);
      const controllers = IOC.get("TestController", "CONTROLLER") as Record<string, any>;
      expect(controllers).toBeDefined();
      expect(controllers).toHaveProperty("app");
      expect(controllers).toBeInstanceOf(TestController);
    });
  });

  describe("Protocol Controllers", () => {
    it("@GrpcController should register with grpc protocol", () => {
      IOC.reg("GrpcTestController", GrpcTestController);

      const controllers = IOC.get("GrpcTestController", "CONTROLLER") as Record<string, any>;
      expect(controllers).toBeDefined();
      expect(controllers).toHaveProperty("app");
      expect(controllers).toBeInstanceOf(GrpcTestController);
    });

    it("@WebSocketController should register with ws protocol", () => {
      IOC.reg("WsTestController", WsTestController);

      const controllers = IOC.get("WsTestController", "CONTROLLER") as Record<string, any>;
      expect(controllers).toBeDefined();
      expect(controllers).toHaveProperty("app");
      expect(controllers).toBeInstanceOf(WsTestController);
    });

    it("@GraphQLController should register with graphql protocol", () => {
      IOC.reg("GraphQLTestController", GraphQLTestController);

      const controllers = IOC.get("GraphQLTestController", "CONTROLLER") as Record<string, any>;
      expect(controllers).toBeDefined();
      expect(controllers).toHaveProperty("app");
      expect(controllers).toBeInstanceOf(GraphQLTestController);
    });
  });

  describe("@Middleware", () => {
    it("should register middleware class", () => {
      IOC.reg("TestMiddleware", TestMiddleware);

      const middlewares = IOC.get("TestMiddleware", "MIDDLEWARE") as Record<string, any>;
      expect(middlewares).toBeDefined();
      expect(middlewares).toHaveProperty("run");
      expect(middlewares).toBeInstanceOf(TestMiddleware);
    });
  });

  describe("@Service", () => {
    it("should register service class", () => {
      IOC.reg("TestService", TestService);

      const services = IOC.get("TestService", "SERVICE") as Record<string, any>;
      expect(services).toBeDefined();
      expect(services).toHaveProperty("app");
      expect(services).toBeInstanceOf(TestService);
    });
  });

  describe("@Plugin", () => {
    it("should register plugin class with Plugin suffix", () => {
      IOC.reg("TestPlugin", TestPlugin);

      const plugins = IOC.get("TestPlugin", "COMPONENT") as Record<string, any>;
      expect(plugins).toBeDefined();
      expect(plugins).toHaveProperty("run");
      expect(plugins).toBeInstanceOf(TestPlugin);
    });

    it("should throw error if class name doesn't end with Plugin", () => {
      expect(() => {
        @Plugin()
        class InvalidName { }
      }).toThrow("Plugin class name must be 'Plugin' suffix.");
    });
  });
  describe("@Aspect", () => {
    it("should register plugin class with Plugin suffix", () => {
      IOC.reg("TestAspect", TestAspect);

      const plugins = IOC.get("TestAspect", "COMPONENT") as Record<string, any>;
      expect(plugins).toBeDefined();
      expect(plugins).toHaveProperty("run");
      expect(plugins).toBeInstanceOf(TestAspect);
    });

    it("should throw error if class name doesn't end with Aspect", () => {
      expect(() => {
        @Aspect()
        class InvalidName { }
      }).toThrow("Aspect class names must use a suffix `Aspect`.");
    });
  });

  describe("Interface Checkers", () => {

    it("implementsMiddlewareInterface should work", () => {
      IOC.reg("TestMiddleware", TestMiddleware);
      const middlewares = IOC.get("TestMiddleware", "MIDDLEWARE") as Record<string, any>;
      expect(implementsMiddlewareInterface(middlewares)).toBe(true);
      expect(implementsMiddlewareInterface({})).toBe(false);
    });

    it("implementsControllerInterface should work", () => {
      IOC.reg("TestController", TestController);
      const controllers = IOC.get("TestController", "CONTROLLER");
      expect(implementsControllerInterface(controllers)).toBe(true);
      expect(implementsControllerInterface({})).toBe(false);
    });

    it("implementsServiceInterface should work", () => {
      IOC.reg("TestService", TestService);
      const services = IOC.get("TestService", "SERVICE");
      expect(implementsServiceInterface(services)).toBe(true);
      expect(implementsServiceInterface({})).toBe(false);
    });

    it("implementsPluginInterface should work", () => {
      IOC.reg("TestPlugin", TestPlugin);
      const plugin = IOC.get("TestPlugin", "COMPONENT");
      expect(implementsPluginInterface(plugin)).toBe(true);
      expect(implementsPluginInterface({})).toBe(false);
    });

    it("implementsAspectInterface should work", () => {
      IOC.reg("TestAspect", TestAspect);
      const aspect = IOC.get("TestAspect", "COMPONENT");
      expect(implementsAspectInterface(aspect)).toBe(true);
      expect(implementsAspectInterface({})).toBe(false);
    });
  });
});
