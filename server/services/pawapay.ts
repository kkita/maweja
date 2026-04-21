/**
 * PawaPay Service — Intégration Mobile Money DRC
 *
 * Docs: https://docs.pawapay.io
 * Sandbox: https://api.sandbox.pawapay.io
 * Production: https://api.pawapay.io
 *
 * Correspondants DRC supportés :
 *   AIRTEL_MONEY_COD  — Airtel Money Congo
 *   MPESA_COD         — Vodacom M-PESA Congo
 *   ORANGE_MONEY_COD  — Orange Money Congo
 */

import crypto from "crypto";

const PAWAPAY_TOKEN = process.env.PAWAPAY_API_TOKEN ?? "";
const PAWAPAY_WEBHOOK_SECRET = process.env.PAWAPAY_WEBHOOK_SECRET ?? "";
const PAWAPAY_BASE_URL = process.env.NODE_ENV === "production"
  ? "https://api.pawapay.io"
  : "https://api.sandbox.pawapay.io";

export const IS_PAWAPAY_CONFIGURED = Boolean(PAWAPAY_TOKEN);

/* ── Correspondent mapping ───────────────────────────────────────────────── */
export const CORRESPONDENT_MAP: Record<string, string> = {
  "Airtel Money":  "AIRTEL_MONEY_COD",
  "M-PESA":        "MPESA_COD",
  "Orange Money":  "ORANGE_MONEY_COD",
};

export const SUPPORTED_METHODS = Object.keys(CORRESPONDENT_MAP);

/* ── Types ───────────────────────────────────────────────────────────────── */
export type PawaPayDepositStatus =
  | "INITIATED"
  | "SUBMITTED"
  | "COMPLETED"
  | "FAILED"
  | "TIMED_OUT"
  | "CANCELLED"
  | "DUPLICATE_IGNORED";

export interface PawaPayDepositResponse {
  depositId: string;
  status: PawaPayDepositStatus;
  amount?: string;
  currency?: string;
  correspondent?: string;
  payer?: { type: string; address: { value: string } };
  created?: string;
  respondedByPayer?: string;
  statementDescription?: string;
}

export interface PawaPayWebhookBody {
  depositId: string;
  status: PawaPayDepositStatus;
  amount: string;
  currency: string;
  correspondent: string;
  payer: { type: string; address: { value: string } };
  customerTimestamp: string;
  statementDescription: string;
  created: string;
  respondedByPayer?: string;
  receivedByRecipient?: string;
  metadata?: Record<string, string>;
}

/* ── Format phone for DRC ────────────────────────────────────────────────── */
export function formatDRCPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("243")) return digits;
  if (digits.startsWith("0") && digits.length === 10) return `243${digits.slice(1)}`;
  if (digits.length === 9) return `243${digits}`;
  return digits;
}

export function isValidDRCPhone(phone: string): boolean {
  const formatted = formatDRCPhone(phone);
  return /^243[0-9]{9}$/.test(formatted);
}

/* ── API Client ──────────────────────────────────────────────────────────── */
export async function initiateDeposit(params: {
  depositId: string;
  amount: number;
  correspondent: string;
  phone: string;
  description: string;
}): Promise<PawaPayDepositResponse> {
  const { depositId, amount, correspondent, phone, description } = params;
  const msisdn = formatDRCPhone(phone);

  const body = {
    depositId,
    amount: amount.toFixed(2),
    currency: "USD",
    correspondent,
    payer: {
      type: "MSISDN",
      address: { value: msisdn },
    },
    customerTimestamp: new Date().toISOString(),
    statementDescription: description.slice(0, 22),
  };

  const resp = await fetch(`${PAWAPAY_BASE_URL}/v1/deposits`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${PAWAPAY_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const error = await resp.text();
    throw new Error(`PawaPay initiate error ${resp.status}: ${error}`);
  }

  return resp.json() as Promise<PawaPayDepositResponse>;
}

export async function getDepositStatus(depositId: string): Promise<PawaPayDepositResponse> {
  const resp = await fetch(`${PAWAPAY_BASE_URL}/v1/deposits/${depositId}`, {
    headers: {
      "Authorization": `Bearer ${PAWAPAY_TOKEN}`,
      "Content-Type": "application/json",
    },
  });

  if (!resp.ok) {
    const error = await resp.text();
    throw new Error(`PawaPay status error ${resp.status}: ${error}`);
  }

  const list = await resp.json() as PawaPayDepositResponse[];
  return list[0] ?? { depositId, status: "FAILED" };
}

/* ── Webhook signature verification ─────────────────────────────────────── */
export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | undefined
): boolean {
  if (!PAWAPAY_WEBHOOK_SECRET) return true;
  if (!signatureHeader) return false;

  const expected = crypto
    .createHmac("sha256", PAWAPAY_WEBHOOK_SECRET)
    .update(rawBody, "utf8")
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signatureHeader, "hex"),
    Buffer.from(expected, "hex"),
  );
}

/* ── Dev/sandbox simulation ──────────────────────────────────────────────── */
export function generateDepositId(): string {
  return `MAWEJA-${Date.now()}-${Math.random().toString(36).slice(2, 9).toUpperCase()}`;
}
