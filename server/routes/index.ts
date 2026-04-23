import type { Express } from "express";
import { createServer, type Server } from "http";
import { normalizeUploadUrls, syncLocalUploadsToCloud } from "../lib/cloudSync";
import { setupWebSocket } from "../websocket";
import { cleanupChatFiles } from "../middleware/upload.middleware";
import { registerAuthRoutes } from "./auth.routes";
import { registerAdminRoutes } from "./admin.routes";
import { registerRestaurantsRoutes } from "./restaurants.routes";
import { registerOrdersRoutes } from "./orders.routes";
import { registerDriversRoutes } from "./drivers.routes";
import { registerChatRoutes } from "./chat.routes";
import { registerWalletRoutes } from "./wallet.routes";
import { registerNotificationsRoutes } from "./notifications.routes";
import { registerServicesRoutes } from "./services.routes";
import { registerMarketingRoutes } from "./marketing.routes";
import { registerDeliveryZonesRoutes } from "./delivery-zones.routes";
import { registerPushRoutes } from "./push.routes";

export async function registerRoutes(app: Express): Promise<Server> {
  await normalizeUploadUrls();
  await syncLocalUploadsToCloud();

  cleanupChatFiles();
  setInterval(cleanupChatFiles, 12 * 60 * 60 * 1000);

  registerAuthRoutes(app);
  registerDriversRoutes(app);
  registerRestaurantsRoutes(app);
  registerOrdersRoutes(app);
  registerChatRoutes(app);
  registerWalletRoutes(app);
  registerNotificationsRoutes(app);
  registerServicesRoutes(app);
  registerMarketingRoutes(app);
  registerDeliveryZonesRoutes(app);
  registerAdminRoutes(app);
  registerPushRoutes(app);

  const httpServer = createServer(app);
  setupWebSocket(httpServer);

  return httpServer;
}
