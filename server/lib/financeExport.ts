import ExcelJS from "exceljs";
import type { Order, Finance, User, Restaurant } from "@shared/schema";

const BRAND_RED = "FFE11D1D";
const BRAND_DARK = "FF1A1A1A";
const HEADER_TEXT = "FFFFFFFF";
const ZEBRA_LIGHT = "FFFAFAFA";
const SECTION_BG = "FFFFF5F5";
const POSITIVE_GREEN = "FF15803D";
const NEGATIVE_RED = "FFB91C1C";
const MUTED = "FF6B7280";

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Espèces (Cash)",
  card: "Carte bancaire",
  mobile_money: "Mobile Money",
  airtel_money: "Airtel Money",
  orange_money: "Orange Money",
  mpesa: "M-Pesa",
  wallet: "Portefeuille MAWEJA",
};

function payLabel(m: string): string {
  if (!m) return "Inconnu";
  return PAYMENT_LABELS[m] || m.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function fmtDate(d: Date | string | null): string {
  if (!d) return "";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (isNaN(dt.getTime())) return "";
  return dt.toLocaleString("fr-CD", { dateStyle: "short", timeStyle: "short" });
}

function applyHeaderStyle(row: ExcelJS.Row) {
  row.height = 28;
  row.eachCell(cell => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_RED } };
    cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: HEADER_TEXT } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = {
      top: { style: "thin", color: { argb: BRAND_DARK } },
      bottom: { style: "medium", color: { argb: BRAND_DARK } },
      left: { style: "thin", color: { argb: BRAND_DARK } },
      right: { style: "thin", color: { argb: BRAND_DARK } },
    };
  });
}

function applyZebra(ws: ExcelJS.Worksheet, startRow: number) {
  for (let i = startRow; i <= ws.rowCount; i++) {
    const row = ws.getRow(i);
    if ((i - startRow) % 2 === 1) {
      row.eachCell(cell => {
        if (!cell.fill || (cell.fill as any).fgColor?.argb === undefined) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ZEBRA_LIGHT } };
        }
      });
    }
    row.eachCell(cell => {
      cell.border = {
        top: { style: "hair", color: { argb: "FFE5E7EB" } },
        bottom: { style: "hair", color: { argb: "FFE5E7EB" } },
        left: { style: "hair", color: { argb: "FFE5E7EB" } },
        right: { style: "hair", color: { argb: "FFE5E7EB" } },
      };
      if (!cell.font) cell.font = { name: "Calibri", size: 10 };
      else cell.font = { name: "Calibri", size: 10, ...cell.font };
    });
  }
}

function addBrandHeader(ws: ExcelJS.Worksheet, title: string, subtitle: string, columnCount: number) {
  const lastCol = String.fromCharCode(64 + columnCount);

  ws.mergeCells(`A1:${lastCol}1`);
  const titleCell = ws.getCell("A1");
  titleCell.value = "MAWEJA";
  titleCell.font = { name: "Calibri", size: 22, bold: true, color: { argb: HEADER_TEXT } };
  titleCell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_DARK } };
  ws.getRow(1).height = 38;

  ws.mergeCells(`A2:${lastCol}2`);
  const subCell = ws.getCell("A2");
  subCell.value = title;
  subCell.font = { name: "Calibri", size: 14, bold: true, color: { argb: HEADER_TEXT } };
  subCell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  subCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_RED } };
  ws.getRow(2).height = 24;

  ws.mergeCells(`A3:${lastCol}3`);
  const metaCell = ws.getCell("A3");
  metaCell.value = subtitle;
  metaCell.font = { name: "Calibri", size: 10, italic: true, color: { argb: MUTED } };
  metaCell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  metaCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: SECTION_BG } };
  ws.getRow(3).height = 20;
}

const MONEY_FMT = '"$"#,##0.00';
const INT_FMT = "#,##0";

export interface FinanceExportInput {
  orders: Order[];
  finances: Finance[];
  users: User[];
  restaurants: Restaurant[];
  dateFrom?: string;
  dateTo?: string;
}

export async function buildFinanceWorkbook(input: FinanceExportInput): Promise<ExcelJS.Buffer> {
  const { orders, finances, users, restaurants, dateFrom, dateTo } = input;
  const wb = new ExcelJS.Workbook();
  wb.creator = "MAWEJA Delivery";
  wb.lastModifiedBy = "MAWEJA Admin";
  wb.created = new Date();
  wb.modified = new Date();
  wb.company = "MAWEJA";

  const periode = dateFrom || dateTo
    ? `Période : ${dateFrom || "début"} → ${dateTo || "aujourd'hui"} • Généré le ${fmtDate(new Date())}`
    : `Toutes périodes confondues • Généré le ${fmtDate(new Date())}`;

  const userById = new Map(users.map(u => [u.id, u]));
  const restById = new Map(restaurants.map(r => [r.id, r]));

  const delivered = orders.filter(o => o.status === "delivered");

  // Per-order breakdown rows
  const orderRows = delivered.map(o => {
    const rest = restById.get(o.restaurantId);
    const rate = rest?.restaurantCommissionRate ?? 20;
    const restType = (rest as any)?.type === "boutique" ? "Boutique" : "Restaurant";
    const restName = rest?.name || `#${o.restaurantId}`;
    const commission = Math.round(o.subtotal * rate) / 100;
    const restNet = Math.round((o.subtotal - commission) * 100) / 100;
    const driverCut = Math.round(o.deliveryFee * 0.8 * 100) / 100;
    const mawejaDeliveryCut = Math.round((o.deliveryFee - driverCut) * 100) / 100;
    const serviceFee = o.taxAmount || 0;
    const mawejaTotal = Math.round((commission + mawejaDeliveryCut + serviceFee) * 100) / 100;
    const driver = o.driverId ? userById.get(o.driverId) : null;
    const client = userById.get(o.clientId);
    return {
      orderNumber: o.orderNumber,
      date: fmtDate(o.createdAt as any),
      client: client?.name || `#${o.clientId}`,
      type: restType,
      partner: restName,
      driver: driver?.name || "—",
      paymentMethod: payLabel(o.paymentMethod),
      paymentStatus: o.paymentStatus === "paid" ? "Payé" : "En attente",
      subtotal: o.subtotal,
      commissionRate: rate,
      mawejaCommission: commission,
      restaurantNet: restNet,
      deliveryFee: o.deliveryFee,
      driverCut,
      mawejaDeliveryCut,
      serviceFee,
      promo: o.promoDiscount || 0,
      total: o.total,
      mawejaTotal,
    };
  });

  // ─── SHEET 1 : RESUME ─────────────────────────────────────────────
  const totalRevenue = finances.filter(f => f.type === "revenue").reduce((s, f) => s + f.amount, 0);
  const totalExpense = finances.filter(f => f.type === "expense").reduce((s, f) => s + f.amount, 0);
  const totalSubtotal = orderRows.reduce((s, r) => s + r.subtotal, 0);
  const totalRestNet = orderRows.reduce((s, r) => s + r.restaurantNet, 0);
  const totalCommission = orderRows.reduce((s, r) => s + r.mawejaCommission, 0);
  const totalDeliveryFee = orderRows.reduce((s, r) => s + r.deliveryFee, 0);
  const totalDriverCut = orderRows.reduce((s, r) => s + r.driverCut, 0);
  const totalMawejaDeliveryCut = orderRows.reduce((s, r) => s + r.mawejaDeliveryCut, 0);
  const totalServiceFee = orderRows.reduce((s, r) => s + r.serviceFee, 0);
  const totalMaweja = orderRows.reduce((s, r) => s + r.mawejaTotal, 0);

  const wsResume = wb.addWorksheet("Résumé Financier", {
    views: [{ showGridLines: false }],
  });
  wsResume.columns = [
    { width: 6 }, { width: 38 }, { width: 22 }, { width: 6 },
    { width: 38 }, { width: 22 }, { width: 6 },
  ];
  addBrandHeader(wsResume, "Tableau de bord financier", periode, 7);

  let row = 5;
  wsResume.mergeCells(`B${row}:F${row}`);
  const sectionA = wsResume.getCell(`B${row}`);
  sectionA.value = "Indicateurs clés (KPIs)";
  sectionA.font = { name: "Calibri", size: 13, bold: true, color: { argb: BRAND_RED } };
  sectionA.alignment = { vertical: "middle", horizontal: "left" };
  wsResume.getRow(row).height = 22;
  row += 2;

  const kpis: Array<[string, number, "money" | "int"]> = [
    ["Nombre total de commandes livrées", delivered.length, "int"],
    ["Chiffre d'affaires brut (sous-totaux)", totalSubtotal, "money"],
    ["Reversé aux Restaurants / Boutiques", totalRestNet, "money"],
    ["Commission MAWEJA sur ventes", totalCommission, "money"],
    ["Frais de livraison collectés", totalDeliveryFee, "money"],
    ["Gain Livreurs (80% livraison)", totalDriverCut, "money"],
    ["Part MAWEJA livraison (20%)", totalMawejaDeliveryCut, "money"],
    ["Frais de service collectés", totalServiceFee, "money"],
    ["REVENU NET MAWEJA (commission + 20% livraison + service)", totalMaweja, "money"],
    ["Total revenus (registre comptable)", totalRevenue, "money"],
    ["Total dépenses (registre comptable)", totalExpense, "money"],
    ["Solde net (revenus − dépenses)", totalRevenue - totalExpense, "money"],
  ];

  for (const [label, value, fmt] of kpis) {
    const r = wsResume.getRow(row);
    r.getCell(2).value = label;
    r.getCell(2).font = { name: "Calibri", size: 11, color: { argb: BRAND_DARK } };
    r.getCell(2).alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    r.getCell(2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: SECTION_BG } };

    r.getCell(3).value = value;
    r.getCell(3).numFmt = fmt === "money" ? MONEY_FMT : INT_FMT;
    const isHighlight = label.includes("REVENU NET MAWEJA");
    r.getCell(3).font = {
      name: "Calibri",
      size: isHighlight ? 13 : 11,
      bold: true,
      color: { argb: isHighlight ? BRAND_RED : BRAND_DARK },
    };
    r.getCell(3).alignment = { vertical: "middle", horizontal: "right", indent: 1 };
    r.getCell(3).fill = { type: "pattern", pattern: "solid", fgColor: { argb: isHighlight ? "FFFFE4E4" : "FFFFFFFF" } };
    r.height = isHighlight ? 26 : 20;

    [2, 3].forEach(c => {
      r.getCell(c).border = {
        top: { style: "thin", color: { argb: "FFE5E7EB" } },
        bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
        left: { style: "thin", color: { argb: "FFE5E7EB" } },
        right: { style: "thin", color: { argb: "FFE5E7EB" } },
      };
    });
    row++;
  }

  row += 2;
  wsResume.mergeCells(`B${row}:F${row}`);
  const noteCell = wsResume.getCell(`B${row}`);
  noteCell.value = "Modèle de répartition : Livreur 80% du frais de livraison • MAWEJA 20% + commission partenaire + frais de service";
  noteCell.font = { name: "Calibri", size: 9, italic: true, color: { argb: MUTED } };
  noteCell.alignment = { wrapText: true };

  // ─── SHEET 2 : COMMANDES LIVREES ─────────────────────────────────
  const wsOrders = wb.addWorksheet("Commandes Livrées", { views: [{ showGridLines: false, state: "frozen", ySplit: 5 }] });
  const orderCols: Array<{ header: string; key: string; width: number; numFmt?: string }> = [
    { header: "N° Commande",         key: "orderNumber",        width: 16 },
    { header: "Date",                key: "date",               width: 18 },
    { header: "Client",              key: "client",             width: 22 },
    { header: "Type",                key: "type",               width: 12 },
    { header: "Partenaire",          key: "partner",            width: 26 },
    { header: "Livreur",             key: "driver",             width: 20 },
    { header: "Méthode paiement",    key: "paymentMethod",      width: 20 },
    { header: "Statut paiement",     key: "paymentStatus",      width: 16 },
    { header: "Sous-total",          key: "subtotal",           width: 14, numFmt: MONEY_FMT },
    { header: "Taux comm. (%)",     key: "commissionRate",     width: 14 },
    { header: "Commission MAWEJA",   key: "mawejaCommission",   width: 18, numFmt: MONEY_FMT },
    { header: "Net Restaurant/Boutique", key: "restaurantNet",  width: 22, numFmt: MONEY_FMT },
    { header: "Frais Livraison",     key: "deliveryFee",        width: 16, numFmt: MONEY_FMT },
    { header: "Gain Livreur (80%)",  key: "driverCut",          width: 18, numFmt: MONEY_FMT },
    { header: "Part MAWEJA Livr. (20%)", key: "mawejaDeliveryCut", width: 22, numFmt: MONEY_FMT },
    { header: "Frais Service",       key: "serviceFee",         width: 14, numFmt: MONEY_FMT },
    { header: "Réduction Promo",     key: "promo",              width: 14, numFmt: MONEY_FMT },
    { header: "Total Client",        key: "total",              width: 14, numFmt: MONEY_FMT },
    { header: "Revenu net MAWEJA",   key: "mawejaTotal",        width: 18, numFmt: MONEY_FMT },
  ];
  wsOrders.columns = orderCols.map(c => ({ key: c.key, width: c.width }));
  addBrandHeader(wsOrders, "Détail des commandes livrées", periode, orderCols.length);

  const headerRow = wsOrders.getRow(5);
  orderCols.forEach((c, i) => { headerRow.getCell(i + 1).value = c.header; });
  applyHeaderStyle(headerRow);

  orderRows.forEach(r => {
    const newRow = wsOrders.addRow(r);
    orderCols.forEach((c, i) => {
      const cell = newRow.getCell(i + 1);
      if (c.numFmt) cell.numFmt = c.numFmt;
      if (["client", "partner", "driver"].includes(c.key)) {
        cell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
      } else if (c.numFmt || c.key === "commissionRate") {
        cell.alignment = { vertical: "middle", horizontal: "right", indent: 1 };
      } else {
        cell.alignment = { vertical: "middle", horizontal: "center" };
      }
      if (c.key === "mawejaTotal") {
        cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: BRAND_RED } };
      } else if (c.key === "driverCut") {
        cell.font = { name: "Calibri", size: 10, color: { argb: POSITIVE_GREEN } };
      } else if (c.key === "promo" && r.promo > 0) {
        cell.font = { name: "Calibri", size: 10, color: { argb: NEGATIVE_RED } };
      }
    });
  });

  // Totals row
  if (orderRows.length > 0) {
    const totalRowVals: any = {
      orderNumber: "TOTAL",
      date: "",
      client: `${orderRows.length} commandes`,
      type: "",
      partner: "",
      driver: "",
      paymentMethod: "",
      paymentStatus: "",
      subtotal: totalSubtotal,
      commissionRate: "",
      mawejaCommission: totalCommission,
      restaurantNet: totalRestNet,
      deliveryFee: totalDeliveryFee,
      driverCut: totalDriverCut,
      mawejaDeliveryCut: totalMawejaDeliveryCut,
      serviceFee: totalServiceFee,
      promo: orderRows.reduce((s, r) => s + r.promo, 0),
      total: orderRows.reduce((s, r) => s + r.total, 0),
      mawejaTotal: totalMaweja,
    };
    const tr = wsOrders.addRow(totalRowVals);
    tr.height = 26;
    tr.eachCell((cell, colNumber) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_DARK } };
      cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: HEADER_TEXT } };
      const col = orderCols[colNumber - 1];
      if (col?.numFmt) cell.numFmt = col.numFmt;
      cell.alignment = col?.numFmt
        ? { vertical: "middle", horizontal: "right", indent: 1 }
        : { vertical: "middle", horizontal: "center" };
      cell.border = {
        top: { style: "medium", color: { argb: BRAND_RED } },
        bottom: { style: "medium", color: { argb: BRAND_RED } },
        left: { style: "thin", color: { argb: BRAND_DARK } },
        right: { style: "thin", color: { argb: BRAND_DARK } },
      };
    });
  }
  applyZebra(wsOrders, 6);
  wsOrders.autoFilter = { from: { row: 5, column: 1 }, to: { row: 5, column: orderCols.length } };

  // ─── SHEET 3 : PAR METHODE DE PAIEMENT ───────────────────────────
  const byPay: Record<string, { count: number; total: number; mawejaCommission: number; driverCut: number; mawejaDeliveryCut: number; serviceFee: number; mawejaTotal: number; restNet: number }> = {};
  for (const r of orderRows) {
    if (!byPay[r.paymentMethod]) byPay[r.paymentMethod] = { count: 0, total: 0, mawejaCommission: 0, driverCut: 0, mawejaDeliveryCut: 0, serviceFee: 0, mawejaTotal: 0, restNet: 0 };
    const p = byPay[r.paymentMethod];
    p.count++; p.total += r.total; p.mawejaCommission += r.mawejaCommission; p.driverCut += r.driverCut;
    p.mawejaDeliveryCut += r.mawejaDeliveryCut; p.serviceFee += r.serviceFee; p.mawejaTotal += r.mawejaTotal; p.restNet += r.restaurantNet;
  }
  const wsPay = wb.addWorksheet("Par Méthode de Paiement", { views: [{ showGridLines: false, state: "frozen", ySplit: 5 }] });
  const payCols: Array<{ header: string; key: string; width: number; numFmt?: string }> = [
    { header: "Méthode",                  key: "method",            width: 26 },
    { header: "Nb commandes",             key: "count",             width: 14 },
    { header: "Total encaissé",           key: "total",             width: 16, numFmt: MONEY_FMT },
    { header: "Net Partenaires",          key: "restNet",           width: 18, numFmt: MONEY_FMT },
    { header: "Commission MAWEJA",        key: "mawejaCommission",  width: 20, numFmt: MONEY_FMT },
    { header: "Gain Livreurs (80%)",      key: "driverCut",         width: 20, numFmt: MONEY_FMT },
    { header: "Part MAWEJA livr. (20%)",  key: "mawejaDeliveryCut", width: 22, numFmt: MONEY_FMT },
    { header: "Frais Service",            key: "serviceFee",        width: 16, numFmt: MONEY_FMT },
    { header: "Revenu Net MAWEJA",        key: "mawejaTotal",       width: 20, numFmt: MONEY_FMT },
  ];
  wsPay.columns = payCols.map(c => ({ key: c.key, width: c.width }));
  addBrandHeader(wsPay, "Répartition par méthode de paiement", periode, payCols.length);
  const phr = wsPay.getRow(5);
  payCols.forEach((c, i) => { phr.getCell(i + 1).value = c.header; });
  applyHeaderStyle(phr);

  Object.entries(byPay).sort((a, b) => b[1].total - a[1].total).forEach(([method, v]) => {
    const r = wsPay.addRow({ method, ...v });
    payCols.forEach((c, i) => {
      const cell = r.getCell(i + 1);
      if (c.numFmt) cell.numFmt = c.numFmt;
      cell.alignment = c.numFmt
        ? { vertical: "middle", horizontal: "right", indent: 1 }
        : (c.key === "method" ? { vertical: "middle", horizontal: "left", indent: 1 } : { vertical: "middle", horizontal: "center" });
      if (c.key === "mawejaTotal") cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: BRAND_RED } };
    });
  });
  applyZebra(wsPay, 6);

  // ─── SHEET 4 : PAR PARTENAIRE (RESTAURANT/BOUTIQUE) ──────────────
  const byPartner: Record<number, { name: string; type: string; count: number; gross: number; commission: number; net: number }> = {};
  for (const o of delivered) {
    const rest = restById.get(o.restaurantId);
    const rate = rest?.restaurantCommissionRate ?? 20;
    const restType = (rest as any)?.type === "boutique" ? "Boutique" : "Restaurant";
    if (!byPartner[o.restaurantId]) byPartner[o.restaurantId] = { name: rest?.name || `#${o.restaurantId}`, type: restType, count: 0, gross: 0, commission: 0, net: 0 };
    const comm = Math.round(o.subtotal * rate) / 100;
    byPartner[o.restaurantId].count++;
    byPartner[o.restaurantId].gross += o.subtotal;
    byPartner[o.restaurantId].commission += comm;
    byPartner[o.restaurantId].net += (o.subtotal - comm);
  }
  const wsPartner = wb.addWorksheet("Par Partenaire", { views: [{ showGridLines: false, state: "frozen", ySplit: 5 }] });
  const partnerCols: Array<{ header: string; key: string; width: number; numFmt?: string }> = [
    { header: "Type",                key: "type",       width: 14 },
    { header: "Partenaire",          key: "name",       width: 30 },
    { header: "Nb commandes",        key: "count",      width: 14 },
    { header: "CA Brut",             key: "gross",      width: 16, numFmt: MONEY_FMT },
    { header: "Commission MAWEJA",   key: "commission", width: 20, numFmt: MONEY_FMT },
    { header: "Net Partenaire",      key: "net",        width: 18, numFmt: MONEY_FMT },
  ];
  wsPartner.columns = partnerCols.map(c => ({ key: c.key, width: c.width }));
  addBrandHeader(wsPartner, "Répartition par Restaurant / Boutique", periode, partnerCols.length);
  const phdr = wsPartner.getRow(5);
  partnerCols.forEach((c, i) => { phdr.getCell(i + 1).value = c.header; });
  applyHeaderStyle(phdr);
  Object.values(byPartner).sort((a, b) => b.gross - a.gross).forEach(p => {
    const r = wsPartner.addRow(p);
    partnerCols.forEach((c, i) => {
      const cell = r.getCell(i + 1);
      if (c.numFmt) {
        cell.numFmt = c.numFmt;
        cell.alignment = { vertical: "middle", horizontal: "right", indent: 1 };
      } else if (c.key === "name") {
        cell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
        cell.font = { name: "Calibri", size: 10, bold: true };
      } else {
        cell.alignment = { vertical: "middle", horizontal: "center" };
      }
    });
  });
  applyZebra(wsPartner, 6);

  // ─── SHEET 5 : PAR LIVREUR ──────────────────────────────────────
  const byDriver: Record<number, { name: string; count: number; deliveryFee: number; earnings: number }> = {};
  for (const o of delivered) {
    if (!o.driverId) continue;
    const d = userById.get(o.driverId);
    if (!byDriver[o.driverId]) byDriver[o.driverId] = { name: d?.name || `#${o.driverId}`, count: 0, deliveryFee: 0, earnings: 0 };
    byDriver[o.driverId].count++;
    byDriver[o.driverId].deliveryFee += o.deliveryFee;
    byDriver[o.driverId].earnings += Math.round(o.deliveryFee * 0.8 * 100) / 100;
  }
  const wsDriver = wb.addWorksheet("Par Livreur", { views: [{ showGridLines: false, state: "frozen", ySplit: 5 }] });
  const drvCols: Array<{ header: string; key: string; width: number; numFmt?: string }> = [
    { header: "Livreur",                  key: "name",         width: 28 },
    { header: "Nb livraisons",            key: "count",        width: 14 },
    { header: "Frais Livraison Total",    key: "deliveryFee",  width: 22, numFmt: MONEY_FMT },
    { header: "Gain Livreur (80%)",       key: "earnings",     width: 20, numFmt: MONEY_FMT },
  ];
  wsDriver.columns = drvCols.map(c => ({ key: c.key, width: c.width }));
  addBrandHeader(wsDriver, "Répartition par Livreur", periode, drvCols.length);
  const dhdr = wsDriver.getRow(5);
  drvCols.forEach((c, i) => { dhdr.getCell(i + 1).value = c.header; });
  applyHeaderStyle(dhdr);
  Object.values(byDriver).sort((a, b) => b.earnings - a.earnings).forEach(p => {
    const r = wsDriver.addRow(p);
    drvCols.forEach((c, i) => {
      const cell = r.getCell(i + 1);
      if (c.numFmt) {
        cell.numFmt = c.numFmt;
        cell.alignment = { vertical: "middle", horizontal: "right", indent: 1 };
      } else if (c.key === "name") {
        cell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
        cell.font = { name: "Calibri", size: 10, bold: true };
      } else {
        cell.alignment = { vertical: "middle", horizontal: "center" };
      }
      if (c.key === "earnings") cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: POSITIVE_GREEN } };
    });
  });
  applyZebra(wsDriver, 6);

  // ─── SHEET 6 : TRANSACTIONS COMPTABLES ───────────────────────────
  const wsTx = wb.addWorksheet("Transactions", { views: [{ showGridLines: false, state: "frozen", ySplit: 5 }] });
  const txCols: Array<{ header: string; key: string; width: number; numFmt?: string }> = [
    { header: "ID",          key: "id",          width: 8 },
    { header: "Date",        key: "date",        width: 18 },
    { header: "Type",        key: "type",        width: 12 },
    { header: "Catégorie",   key: "category",    width: 22 },
    { header: "Montant",     key: "amount",      width: 16, numFmt: MONEY_FMT },
    { header: "Description", key: "description", width: 50 },
    { header: "Référence",   key: "reference",   width: 16 },
  ];
  wsTx.columns = txCols.map(c => ({ key: c.key, width: c.width }));
  addBrandHeader(wsTx, "Registre comptable des transactions", periode, txCols.length);
  const txHdr = wsTx.getRow(5);
  txCols.forEach((c, i) => { txHdr.getCell(i + 1).value = c.header; });
  applyHeaderStyle(txHdr);
  finances.sort((a, b) => new Date(b.createdAt as any).getTime() - new Date(a.createdAt as any).getTime()).forEach(f => {
    const r = wsTx.addRow({
      id: f.id,
      date: fmtDate(f.createdAt as any),
      type: f.type === "revenue" ? "Revenu" : "Dépense",
      category: f.category,
      amount: f.amount,
      description: f.description,
      reference: f.reference || "",
    });
    txCols.forEach((c, i) => {
      const cell = r.getCell(i + 1);
      if (c.numFmt) {
        cell.numFmt = c.numFmt;
        cell.alignment = { vertical: "middle", horizontal: "right", indent: 1 };
        cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: f.type === "revenue" ? POSITIVE_GREEN : NEGATIVE_RED } };
      } else if (c.key === "description") {
        cell.alignment = { vertical: "middle", horizontal: "left", indent: 1, wrapText: true };
      } else if (c.key === "type") {
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: f.type === "revenue" ? POSITIVE_GREEN : NEGATIVE_RED } };
      } else {
        cell.alignment = { vertical: "middle", horizontal: "center" };
      }
    });
  });
  applyZebra(wsTx, 6);
  wsTx.autoFilter = { from: { row: 5, column: 1 }, to: { row: 5, column: txCols.length } };

  return await wb.xlsx.writeBuffer();
}
