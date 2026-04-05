export type ExportColumn<T extends Record<string, any>> = {
  key: keyof T | string;
  header: string;
};

export type ExportPayload<T extends Record<string, any>> = {
  title: string;
  meta?: string[];
  columns: ExportColumn<T>[];
  rows: T[];
};

function safeText(v: unknown) {
  if (v === null || v === undefined) return "";
  return String(v);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * =========================================================
 * ✅ Export to Excel (.xlsx)
 * =========================================================
 */
export async function exportToExcel<T extends Record<string, any>>(
  payload: ExportPayload<T>
) {
  const { title, meta = [], columns, rows } = payload;

  const XLSX = await import("xlsx");

  const header = columns.map((c) => c.header);

  const data = rows.map((r) => {
    const obj: Record<string, any> = {};
    for (const c of columns) {
      const k = c.key as string;
      obj[c.header] = (r as any)[k];
    }
    return obj;
  });

  const metaRows = meta.map((m) => ({ Info: m }));
  const wb = XLSX.utils.book_new();

  const wsData = XLSX.utils.json_to_sheet(data, {
    header: columns.map((c) => c.header),
  });

  XLSX.utils.sheet_add_aoa(wsData, [header], { origin: "A1" });
  XLSX.utils.book_append_sheet(wb, wsData, "Report");

  if (metaRows.length) {
    const wsMeta = XLSX.utils.json_to_sheet(metaRows);
    XLSX.utils.book_append_sheet(wb, wsMeta, "Meta");
  }

  const filename = `${title.replace(/[^\w\- ]+/g, "").trim() || "report"}.xlsx`;

  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });

  downloadBlob(
    new Blob([out], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    filename
  );
}

/**
 * =========================================================
 * ✅ Export to PDF (.pdf)
 * (Logo + watermark removed)
 * =========================================================
 */
export async function exportToPdf<T extends Record<string, any>>(
  payload: ExportPayload<T>
) {
  const { title, meta = [], columns, rows } = payload;

  const jsPDFModule = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDFModule.jsPDF({
    orientation: "landscape",
    unit: "pt",
    format: "a4",
  });

  // Title
  doc.setFontSize(16);
  doc.text(title, 40, 40);

  // Meta
  doc.setFontSize(10);
  let y = 58;
  for (const line of meta) {
    doc.text(safeText(line), 40, y);
    y += 14;
  }

  // Table
  const head = [columns.map((c) => c.header)];
  const body = rows.map((r) =>
    columns.map((c) => {
      const k = c.key as string;
      return safeText((r as any)[k]);
    })
  );

  autoTable(doc, {
    startY: Math.max(y + 10, 80),
    head,
    body,
    styles: { fontSize: 9, cellPadding: 6 },
    headStyles: { fillColor: [20, 80, 200] },
    margin: { left: 40, right: 40 },
  });

  const filename = `${title.replace(/[^\w\- ]+/g, "").trim() || "report"}.pdf`;
  doc.save(filename);
}