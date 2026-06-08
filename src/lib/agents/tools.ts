import { tool } from "ai";
import { z } from "zod";
import { callMcpTool } from "@/lib/mcp/client";

export const kaprukaSearchProducts = tool({
  description:
    "Search the Kapruka product catalog by keyword with optional filters for category, price range, stock status, and sorting.",
  parameters: z.object({
    q: z.string().min(3).describe("Search query (e.g. 'birthday cake', 'roses', 'chocolates')"),
    category: z.string().optional().describe("Filter by category name (e.g. 'Birthday', 'Cakes')"),
    min_price: z.number().optional().describe("Minimum price (inclusive)"),
    max_price: z.number().optional().describe("Maximum price (inclusive)"),
    limit: z.number().optional().default(10).describe("Number of results (1-50, default 10)"),
    sort: z
      .enum(["relevance", "price_asc", "price_desc", "newest", "bestseller"])
      .optional()
      .default("relevance")
      .describe("Sort order"),
    in_stock_only: z.boolean().optional().default(false).describe("Only show in-stock items"),
    currency: z.enum(["LKR", "USD", "GBP", "AUD", "CAD", "EUR"]).optional().default("LKR"),
    response_format: z.enum(["json", "markdown"]).optional().default("json"),
  }),
  execute: async (args) => {
    return await callMcpTool("kapruka_search_products", { params: args });
  },
});

export const kaprukaGetProduct = tool({
  description: "Get full product details by product ID including name, price, description, variants, images, stock, and shipping info.",
  parameters: z.object({
    product_id: z.string().describe("Kapruka product ID (e.g. 'cake00ka002034')"),
    currency: z.enum(["LKR", "USD", "GBP", "AUD", "CAD", "EUR"]).optional().default("LKR"),
    response_format: z.enum(["json", "markdown"]).optional().default("json"),
  }),
  execute: async (args) => {
    return await callMcpTool("kapruka_get_product", { params: args });
  },
});

export const kaprukaListCategories = tool({
  description: "List all top-level product categories available on Kapruka with browse URLs.",
  parameters: z.object({
    depth: z.number().min(1).max(2).optional().default(1).describe("Sub-category levels (1 or 2)"),
    response_format: z.enum(["json", "markdown"]).optional().default("json"),
  }),
  execute: async (args) => {
    return await callMcpTool("kapruka_list_categories", { params: args });
  },
});

export const kaprukaListDeliveryCities = tool({
  description: "Search the Kapruka delivery network by city name to find deliverable cities.",
  parameters: z.object({
    query: z.string().optional().describe("Filter cities by partial name match (e.g. 'Colombo')"),
    limit: z.number().optional().default(25).describe("Max cities to return (1-50)"),
    response_format: z.enum(["json", "markdown"]).optional().default("json"),
  }),
  execute: async (args) => {
    return await callMcpTool("kapruka_list_delivery_cities", { params: args });
  },
});

export const kaprukaCheckDelivery = tool({
  description: "Check delivery availability, estimated dates, and rates for a specific city.",
  parameters: z.object({
    city: z.string().describe("Canonical city name (e.g. 'Colombo 03', 'Galle')"),
    delivery_date: z.string().optional().describe("Target delivery date in ISO format (YYYY-MM-DD)"),
    product_id: z.string().optional().describe("Optional product ID for perishable warnings"),
    response_format: z.enum(["json", "markdown"]).optional().default("json"),
  }),
  execute: async (args) => {
    return await callMcpTool("kapruka_check_delivery", { params: args });
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
    delivery_city: z.string().describe("Delivery city name"),
    recipient_name: z.string().describe("Recipient name"),
    recipient_phone: z.string().describe("Recipient phone number"),
    recipient_address: z.string().describe("Delivery address"),
    gift_message: z.string().optional().describe("Optional gift message"),
    currency: z.enum(["LKR", "USD"]).optional().default("LKR"),
  }),
  execute: async (args) => {
    return await callMcpTool("kapruka_create_order", { params: args });
  },
});

export const kaprukaTrackOrder = tool({
  description: "Track the status of an existing order by order number.",
  parameters: z.object({
    order_number: z.string().describe("Order number (e.g. KAP-12345)"),
    response_format: z.enum(["json", "markdown"]).optional().default("json"),
  }),
  execute: async (args) => {
    return await callMcpTool("kapruka_track_order", { params: args });
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
