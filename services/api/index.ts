// Services Layer barrel — import domain services from a single entry point:
//   import { ProductService, CategoryService } from "@/services/api";
export { httpClient, ApiError, getAuthToken } from "./httpClient";
export { ProductService } from "./productService";
export { CategoryService } from "./categoryService";
export { OrderService } from "./orderService";
export { MarketService } from "./marketService";
export { KitchenService } from "./kitchenService";
export { AnnouncementService } from "./announcementService";
export { AuthService } from "./authService";
export { FeedbackService } from "./feedbackService";
export { NotificationService } from "./notificationService";
export { SettingsService } from "./settingsService";
export { PromoCodeService } from "./promoCodeService";
