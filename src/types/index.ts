import { ReactNode } from "react";

export type UserRole = "admin" | "dealer" | "retailer" | "staff";
export type UserSubRole = "sales_executive" | "employee" ;

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  role: UserRole;
  sub_role:string;
  dealer_id?: string;
  active: boolean;
  createdBy: string;
  createdAt: string;
  assigned:string;
  user: string;
  passwordChangedAt: Date;
}

export interface Retailer extends User {
  contact_person: string;
  store_name: string;
  phone: string;
  address: string;
  dealer_id: string;
  registration_date: string;
  assigned:string;
  city: string
}

export interface Staff extends User {
  contact_person: string;
  sub_role:string;
  phone: string;
  address: string;
  dealer_id: string;
  registration_date: string;
}

export type Product = {
  id: string;
  name: string;
  brand: string;
  model: string;
  price: number;
  stock: number;
  description: string;
  dealer_id: number;
  created_at?: string;
  image?: string | null;
};

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
}

export type OrderStatus = "pending" | "approved" | "dispatched" | "delivered" | "cancelled";

export interface Order {
  id: string;
  retailerId: string;
  retailerName: string;
  dealerId: string;
  total: number;
  notes: string;
  status: OrderStatus;
  createdAt: string;
  storeName: string;
  order_by:string;
  order_by_id:number
  items: {
    productId: number;
    quantity: number;
    price: number;
    product: {
      name: string;
      price: number;
    };
  }[];
}


export interface VoiceParsedItem {
  productId: string;
  productName: string;
  quantity: number;
  confidence: number;
  matchReason: string;
}

export interface VoiceUnmatchedSegment {
  text: string;
  detectedKeywords: string[];
  suggestedProductIds?: string[];
}

export interface VoiceParseResult {
  success: boolean;
  error?: string;
  message?: string;
  parsed: VoiceParsedItem[];
  unmatchedSegments?: VoiceUnmatchedSegment[];
  rawTranscript: string;
}