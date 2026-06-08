import { tool } from "ai";
import { z } from "zod";
import { callMcpTool } from "@/lib/mcp/client";

export const kaprukaSearchProducts = tool({
  description:
    "Search the Kapruka product catalog by keyword with optional filters for category, price range, stock status, and sorting.",
  parameters: z.object({
    q: z.string().describe("Search query keyword"),
    category: z.string().optional().describe("Filter by category name"),
    min_price: z.number().optional().describe("Minimum price filter"),
    max_price: z.number().optional().describe("Maximum price filter"),
    page_size: z.number().optional().default(5).describe("Number of results (default 5)"),
    page: z.number().optional().default(1).describe("Page number for pagination"),
    sort: z
      .enum(["relevance", "price_asc", "price_desc", "newest", "popularity"])
      .optional()
      .default("relevance")
      .describe("Sort order"),
    in_stock_only: z.boolean().optional().default(true).describe("Only show in-stock items"),
    currency: z.enum(["LKR", "USD"]).optional().default("LKR").describe("Currency for prices"),
    response_format: z.enum(["json", "text"]).optional().default("json"),
  }),
  execute: async (args) => {
    const result = await callMcpTool("kapruka_search_products", args);
    return result;
  },
});

export const kaprukaGetProduct = tool({
  description: "Get full product details by product ID including name, price, variants, images, and shipping info.",
  parameters: z.object({
    id: z.string().describe("Product ID"),
    currency: z.enum(["LKR", "USD"]).optional().default("LKR"),
  }),
  execute: async (args) => {
    const result = await callMcpTool("kapruka_get_product", args);
    return result;
  },
});

export const kaprukaListCategories = tool({
  description: "List all top-level product categories available on Kapruka with browse URLs.",
  parameters: z.object({}),
  execute: async () => {
    const result = await callMcpTool("kapruka_list_categories", {});
    return result;
  },
});

export const kaprukaListDeliveryCities = tool({
  description: "Search the Kapruka delivery network by city name or alias to find deliverable cities.",
  parameters: z.object({
    q: z.string().describe("City name or alias to search"),
  }),
  execute: async (args) => {
    const result = await callMcpTool("kapruka_list_delivery_cities", args);
    return result;
  },
});

export const kaprukaCheckDelivery = tool({
  description: "Check delivery availability, estimated date, and rate for a specific city and product combination.",
  parameters: z.object({
    city_id: z.string().describe("Delivery city ID"),
    product_id: z.string().describe("Product ID to check delivery for"),
  }),
  execute: async (args) => {
    const result = await callMcpTool("kapruka_check_delivery", args);
    return result;
  },
});

export const kaprukaCreateOrder = tool({
  description:
    "Create a guest checkout order and get a click-to-pay URL. Price is locked for 60 minutes.",
  parameters: z.object({
    items: z
      .array(
        z.object({
          product_id: z.string(),
          quantity: z.number().min(1),
          variant: z.string().optional(),
        })
      )
      .describe("Items to order"),
    delivery_city_id: z.string().describe("Delivery city ID"),
    recipient_name: z.string().describe("Recipient name"),
    recipient_phone: z.string().describe("Recipient phone number"),
    recipient_address: z.string().describe("Delivery address"),
    gift_message: z.string().optional().describe("Optional gift message"),
    currency: z.enum(["LKR", "USD"]).optional().default("LKR"),
  }),
  execute: async (args) => {
    const result = await callMcpTool("kapruka_create_order", args);
    return result;
  },
});

export const kaprukaTrackOrder = tool({
  description: "Track the status of an existing order by order number.",
  parameters: z.object({
    order_number: z.string().describe("Order number (e.g. KAP-12345)"),
  }),
  execute: async (args) => {
    const result = await callMcpTool("kapruka_track_order", args);
    return result;
  },
});

export function getAllTools() {
  return {
    kapruka_search_products: kaprukaSearchProducts,
    kapruka_get_product: kaprukaGetProduct,
    kapruka_list_categories: kaprukaListCategories,
    kapruka_list_delivery_cities: kaprukaListDeliveryCities,
    kapruka_check_delivery: kaprukaCheckDelivery,
    kapruka_create_order: kaprukaCreateOrder,
    kapruka_track_order: kaprukaTrackOrder,
  };
}
