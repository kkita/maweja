import type { Order } from "@shared/schema";

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  walletBalance: number;
  loyaltyPoints: number;
  isBlocked: boolean;
  createdAt: string;
  avatar: string | null;
  address?: string | null;
  role: string;
}

export interface EnrichedCustomer extends Customer {
  orderCount: number;
  totalSpent: number;
  lastOrderTs: number | null;
  aov: number;
  isVIP: boolean;
  isNew: boolean;
  isDormant: boolean;
  ageDays: number;
}

export type CustomerOrder = Order;
