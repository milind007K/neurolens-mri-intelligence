import type { MriCase } from "./cases";
import { keyImage } from "./mri-render";

export async function generateHospitalReport(c: MriCase) {
  const [{ jsPDF }, QR] = await Promise.all([import("jspdf"), import("qrcode")]);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210, M = 12, CW = W - 2 * M;
  const reportId = `NL-${c.dicom.studyDate.replace(/-/g, "")}-${c.patient.id.slice(-5)}`;
  const now = new Date();
  const navy: [number, number, number] = [14, 42, 92];
  const blue: [number, number, number] = [30, 99, 214];

  // ---------- HEADER ----------
  doc.setFillColor(...navy);
  doc.rect(0, 0, W, 4, "F");
  doc.setFillColor(...blue);
  doc.roundedRect(M, 9, 16, 16, 2, 2, "F");
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("R", M + 8, 19.5, { align: "center" });
  doc.setDrawColor(255);
  doc.setLineWidth(0.8);
  doc.line(M + 3, 22, M + 13, 22);
  doc.setTextColor(...navy);
  doc.setFontSize(15);
  doc.text("RCOEM MEDICAL CENTER", M + 20, 15);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(70);
  doc.text("Department of Radiodiagnosis & Advanced MR Imaging", M + 20, 20);
  doc.setFontSize(7.5);
  doc.text("NABH Accredited · Powered by NeuroLens AI", M + 20, 24.5);

  const qr = await QR.toDataURL(`https://neurolens.rcoem.ac.in/verify/${reportId}`, { margin: 0, width: 200 });
  doc.addImage(qr, "PNG", W - M - 20, 8, 20, 20);
  doc.setFontSize(7.5);
  doc.setTextColor(60);
  const rx = W - M - 23;
  doc.setFont("helvetica", "bold");
  doc.text(`Report ID: ${reportId}`, rx, 12, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.text(`Date: ${now.toLocaleDateString("en-GB")} ${now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`, rx, 16, { align: "right" });
  doc.text("Scan to verify", rx, 20, { align: "right" });
  doc.setDrawColor(...blue);
  doc.setLineWidth(0.6);
  doc.line(M, 31, W - M, 31);

  // ---------- PATIENT BOX ----------
  let y = 35;
  doc.setDrawColor(170);
  doc.setLineWidth(0.25);
  doc.setFillColor(244, 247, 252);
  doc.rect(M, y, CW, 22, "FD");
  const rows: [string, string, string, string][] = [
    ["Patient Name", c.patient.name.toUpperCase(), "Patient ID", c.patient.id],
    ["Age / Sex", `${c.patient.age} Y / ${c.patient.sex === "M" ? "Male" : "Female"}`, "Study Date", c.dicom.studyDate.split("-").reverse().join("/")],
    ["Referring Doctor", c.patient.referring, "Modality", `MR · ${c.dicom.field} · ${c.dicom.manufacturer}`],
    ["MRI Type", c.mriType, "Seq. / Slice", `TR ${c.dicom.tr} / TE ${c.dicom.te} · ${c.dicom.sliceThickness}`],
  ];
  rows.forEach((r, i) => {
    const ry = y + 5 + i * 5;
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold"); doc.setTextColor(...navy);
    doc.text(r[0], M + 3, ry); doc.text(r[2], M + CW / 2 + 3, ry);
    doc.setFont("helvetica", "normal"); doc.setTextColor(30);
    doc.text(": " + r[1], M + 32, ry); doc.text(": " + r[3], M + CW / 2 + 27, ry);
  });
  doc.line(M + CW / 2, y, M + CW / 2, y + 22);

  y += 26;
  doc.setFillColor(...navy);
  doc.rect(M, y, CW, 7, "F");
  doc.setTextColor(255); doc.setFont("helvetica", "bold"); doc.setFontSize(10.5);
  doc.text(c.mriType, W / 2, y + 4.9, { align: "center" });
  y += 11;

  const section = (title: string) => {
    doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(...blue);
    doc.text(title, M, y);
    doc.setDrawColor(...blue); doc.setLineWidth(0.3);
    doc.line(M, y + 1.2, M + doc.getTextWidth(title), y + 1.2);
    y += 5;
  };
  const para = (t: string, w = CW, x = M) => {
    doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(30);
    const lines = doc.splitTextToSize(t, w);
    doc.text(lines, x, y);
    y += lines.length * 3.7 + 1.5;
  };

  // ---------- SECTION 1 ----------
  section("CLINICAL HISTORY");
  para(c.history);
  section("TECHNIQUE");
  para(c.technique);

  // ---------- SECTION 2: FINDINGS + key image ----------
  section("FINDINGS");
  const imgW = 52, textW = CW - imgW - 5;
  const startY = y;
  doc.addImage(keyImage(c), "JPEG", W - M - imgW, startY, imgW, imgW);
  doc.setDrawColor(120); doc.rect(W - M - imgW, startY, imgW, imgW);
  doc.setFontSize(6.5); doc.setTextColor(90);
  doc.text(`Key image: Axial · ${c.lesion ? "Grad-CAM + AI bounding box" : "no lesion"}`, W - M - imgW, startY + imgW + 3);
  c.findings.forEach((f) => {
    doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(30);
    const lines = doc.splitTextToSize(f, textW - 4);
    doc.setFillColor(...blue); doc.circle(M + 1, y - 1, 0.7, "F");
    doc.text(lines, M + 4, y);
    y += lines.length * 3.7 + 1.2;
  });
  y = Math.max(y, startY + imgW + 6);

  // ---------- SECTION 3: IMPRESSION ----------
  doc.setFillColor(255, 248, 230);
  doc.setDrawColor(220, 160, 40);
  doc.setFont("helvetica", "bold"); doc.setFontSize(9.5);
  const imp = doc.splitTextToSize(c.impression, CW - 32);
  const ih = imp.length * 4.2 + 5;
  doc.rect(M, y, CW, ih, "FD");
  doc.setFont("helvetica", "bold"); doc.setFontSize(9.5); doc.setTextColor(20);
  doc.text("IMPRESSION:", M + 3, y + 5.5);
  doc.text(imp, M + 27, y + 5.5);
  y += ih + 4;

  // ---------- SECTION 4: CDS BOX ----------
  const triageColor: Record<MriCase["triage"], [number, number, number]> = { CRITICAL: [214, 40, 57], URGENT: [230, 126, 34], ROUTINE: [39, 160, 90] };
  const cdsTop = y;
  doc.setFillColor(235, 243, 255);
  doc.setDrawColor(...blue); doc.setLineWidth(0.6);
  const boxH = 64;
  doc.roundedRect(M, cdsTop, CW, boxH, 2, 2, "FD");
  doc.setFillColor(...blue);
  doc.rect(M, cdsTop, CW, 6.5, "F");
  doc.setTextColor(255); doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("AGENTIC CLINICAL DECISION SUPPORT  ·  Supervisor + Segmentation + Report + Decision Agents", M + 3, cdsTop + 4.5);
  y = cdsTop + 11;
  doc.setTextColor(20); doc.setFontSize(8.5);
  doc.text("Diagnosis:", M + 3, y);
  doc.setFont("helvetica", "normal");
  doc.text(`${c.diagnosis} (${c.confidence}% confidence)  ·  ICD-10: ${c.icd}`, M + 22, y);
  y += 5.5;
  doc.setFont("helvetica", "bold"); doc.text("Triage:", M + 3, y);
  doc.setFillColor(...triageColor[c.triage]);
  doc.roundedRect(M + 22, y - 3.6, 24, 5, 1.2, 1.2, "F");
  doc.setTextColor(255); doc.text(c.triage, M + 34, y, { align: "center" });
  y += 6;
  const colW = CW / 2 - 6;
  const colY = y;
  doc.setTextColor(20); doc.setFont("helvetica", "bold"); doc.text("Recommended Next Steps:", M + 3, y);
  y += 4; doc.setFont("helvetica", "normal"); doc.setFontSize(8);
  c.nextSteps.forEach((s, i) => {
    const l = doc.splitTextToSize(`${i + 1}. ${s}`, colW);
    doc.text(l, M + 4, y); y += l.length * 3.4;
  });
  let y2 = colY;
  const cx = M + CW / 2 + 2;
  doc.setFont("helvetica", "bold"); doc.setFontSize(8.5); doc.text("Prognosis & Follow-up:", cx, y2);
  y2 += 4; doc.setFont("helvetica", "normal"); doc.setFontSize(8);
  const pl = doc.splitTextToSize(c.prognosis, colW);
  doc.text(pl, cx, y2); y2 += pl.length * 3.4 + 0.8;
  c.followUp.forEach((f) => { const l = doc.splitTextToSize(`• ${f}`, colW); doc.text(l, cx, y2); y2 += l.length * 3.4; });
  y = Math.max(y, y2) + 2;
  doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.setTextColor(...navy);
  doc.text("AI Reasoning Trace:", M + 3, y); y += 3;
  doc.setFont("courier", "normal"); doc.setFontSize(6.3); doc.setTextColor(70);
  c.reasoning.forEach((r) => { const l = doc.splitTextToSize(`> ${r}`, CW - 6); doc.text(l, M + 3, y); y += l.length * 2.7; });
  y = Math.max(y + 2, cdsTop + boxH) + 5;

  // ---------- SIGNATURE ----------
  const sigY = Math.max(y, 252);
  doc.setFont("helvetica", "italic"); doc.setFontSize(12); doc.setTextColor(...blue);
  doc.text("NeuroLens-AI", M, sigY);
  doc.text(c.region === "brain" ? "Dr. R. Mehta" : "Dr. K. Thakre", W - M, sigY, { align: "right" });
  doc.setDrawColor(150); doc.setLineWidth(0.2);
  doc.line(M, sigY + 1.5, M + 60, sigY + 1.5); doc.line(W - M - 60, sigY + 1.5, W - M, sigY + 1.5);
  doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(60);
  doc.text("Electronically signed by NeuroLens / RadioLens AI System v2.0", M, sigY + 5);
  doc.text(`Verified by ${c.region === "brain" ? "Dr. R. Mehta, MD (Radiodiagnosis)" : "Dr. K. Thakre, DNB (Radiology)"}`, W - M, sigY + 5, { align: "right" });

  // ---------- FOOTER (all pages) ----------
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFillColor(244, 247, 252);
    doc.rect(0, 270, W, 27, "F");
    doc.setDrawColor(...blue); doc.setLineWidth(0.5); doc.line(0, 270, W, 270);
    doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.setTextColor(180, 30, 40);
    doc.text("Disclaimer: This is an AI-assisted report; final correlation with clinical findings is advised.", M, 275);
    doc.setFont("helvetica", "normal"); doc.setTextColor(80); doc.setFontSize(6.8);
    doc.text("RCOEM Medical Center · Gittikhadan, Katol Road, Nagpur – 440013, Maharashtra", M, 280);
    doc.text("Tel: +91-712-2580011 · radiology@rcoem-medical.in · www.rcoem.ac.in", M, 284);
    doc.text(`Page ${p} of ${pages}`, W - M, 284, { align: "right" });
    doc.text("Academic demonstration — RCOEM CSE (AI/ML) Major Project 2026-27", W - M, 280, { align: "right" });
    doc.setFillColor(...navy); doc.rect(0, 293, W, 4, "F");
  }

  doc.save(`${reportId}_${c.patient.name.replace(/\s+/g, "_")}.pdf`);
}
