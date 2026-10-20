export interface DicomTags {
  name: string; age: string; sex: string; id: string; studyDate: string; modality: string;
  sliceThickness: string; tr: string; te: string; bodyPart: string; series: string; field: string; manufacturer: string;
}

export async function parseMriDicom(file: File): Promise<DicomTags> {
  if (!/\.dcm$/i.test(file.name) && file.type !== "application/dicom") throw new Error("Only .dcm MRI files are supported.");
  const dicomParser = (await import("dicom-parser")).default ?? (await import("dicom-parser"));
  const buf = new Uint8Array(await file.arrayBuffer());
  let ds;
  try { ds = dicomParser.parseDicom(buf); } catch { throw new Error("This file is not a valid DICOM file."); }
  const s = (t: string) => (ds.string(t) ?? "").trim();
  const modality = s("x00080060");
  if (modality !== "MR") throw new Error(`Modality "${modality || "unknown"}" rejected — NeuroLens accepts MRI (MR) only, no X-ray/CT.`);
  const d = s("x00080020");
  return {
    name: s("x00100010").replace(/\^/g, " ") || "ANONYMOUS",
    age: s("x00101010").replace(/^0+/, "") || "—",
    sex: s("x00100040") || "—",
    id: s("x00100020") || "UPLOAD-001",
    studyDate: d.length === 8 ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6)}` : new Date().toISOString().slice(0, 10),
    modality,
    sliceThickness: s("x00180050") ? `${s("x00180050")} mm` : "—",
    tr: s("x00180080") ? `${Math.round(+s("x00180080"))} ms` : "—",
    te: s("x00180081") ? `${Math.round(+s("x00180081"))} ms` : "—",
    bodyPart: s("x00180015") || "BRAIN",
    series: s("x0008103e") || "MR series",
    field: s("x00180087") ? `${s("x00180087")} T` : "—",
    manufacturer: s("x00080070") || "—",
  };
}
