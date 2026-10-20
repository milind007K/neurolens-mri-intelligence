# NeuroLens MRI Intelligence

Build a Final Year Major Project - "NeuroLens AI - MRI Intelligence Platform" - Title: AI-POWERED MRI REPORT GENERATION AND CLINICAL DECISION SUPPORT USING GENERATIVE AI AND AGENTIC AI - For RCOEM Nagpur CSE AI/ML.

CRITICAL REQUIREMENT: ONLY MRI, NO X-RAY. Focus on Brain MRI, Knee MRI, Spine MRI. This is for RCOEM Major Project 2026-27.

TECH STACK:

Frontend: Next.js 14, TypeScript, Tailwind, shadcn/ui, Cornerstone3D for DICOM MRI viewer

Backend: FastAPI, LangGraph multi-agent

AI: MONAI + BiomedCLIP for MRI, LLaVA-Med for report, LangChain Agentic

PDF: jsPDF + html2canvas for hospital-grade report generation

MANDATORY ADVANCED FEATURES:

1. MRI-ONLY PIPELINE:

- Support ONLY .dcm MRI scans (Brain, Spine, Knee). Show 3 pre-loaded demo cases:

  Case A: Brain MRI Normal (98% conf)

  Case B: Brain MRI - Glioma / Tumor detected in Left Frontal Lobe (92% conf)

  Case C: Knee MRI - ACL Tear + Meniscus Injury (95% conf)

- DICOM MRI Viewer: Must have 4 views (Axial, Sagittal, Coronal, 3D), with Slice scroller, Windowing, Zoom, Lesion Highlight with bounding box + heatmap overlay (Grad-CAM)

- Parse DICOM Tags: Patient Name, Age, Sex, Study Date, Modality = MR, Slice Thickness, TR/TE

2. HOSPITAL-GRADE PDF REPORT GENERATION - THIS IS MOST IMPORTANT:

Create a "Generate Hospital Report PDF" button that creates a REAL hospital PDF like this layout:

[HEADER]

- Left: Hospital Logo Placeholder "RCOEM Medical Center - Dept of Radiodiagnosis"

- Right: Report ID, Date, QR Code (for verification)

- Patient Details Box: Name, Age/Sex, Patient ID, Referring Doctor, Study Date, MRI Type (e.g., MRI BRAIN WITH CONTRAST)

[SECTION 1: CLINICAL HISTORY & TECHNIQUE]

Auto-generated: "History of headache and seizures. MRI Brain was performed on 3T scanner using T1, T2, FLAIR, DWI sequences..."

[SECTION 2: FINDINGS - Structured Bullet Points]

Generative AI generated detailed findings: e.g., "A well-defined heterogeneous lesion measuring 3.2 x 2.8 cm noted in left frontal lobe, showing peripheral enhancement..."

[SECTION 3: IMPRESSION]

Final diagnosis in bold: e.g., "IMPRESSION: Findings are suggestive of High-Grade Glioma (WHO Grade IV) in left frontal lobe."

[SECTION 4: AGENTIC CLINICAL DECISION SUPPORT BOX - Highlighted]

- Diagnosis: Glioma (92% confidence) - ICD-10: C71.1

- Triage: CRITICAL - Red badge

- Recommended Next Steps: 1. Neurosurgery consult urgently, 2. MR Spectroscopy, 3. Biopsy

- Prognosis & Follow-up timeline

- AI Reasoning Trace (small font)

[FOOTER]

- Digital Signature of AI + Radiologist: "Electronically signed by RadioLens AI System v2.0 - Verified by Dr. [Name]"

- Disclaimer: "This is an AI-assisted report, final correlation with clinical findings advised"

- Page 1 of 1, Hospital Address, Contact

Use jsPDF to generate this on-click, with proper fonts, tables, borders. The PDF must look exactly like a private hospital report (Apollo/Fortis style), not a simple text dump.

3. AGENTIC SYSTEM:

- Supervisor Agent orchestrates 3 agents: 1. MRI Segmentation Agent (MONAI UNet), 2. Report Writer Agent (BioGPT), 3. Decision Agent (Clinical Guidelines RAG from PubMed)

- Show agent thinking steps in UI like a terminal

4. UI MUST BE PREMIUM:

- Landing page with "AI-Powered MRI Report Generation..." title, brain MRI animation

- Dashboard: Total MRIs, Avg Time 6.2s, Accuracy 96.1%

- When user clicks a case, show MRI viewer left, AI analysis right, and at bottom BIG BLUE BUTTON "Download Official Hospital Report PDF"

- Make it look like 6 months work

Build it fully functional, no upload errors, PDF generation must work perfectly. Pre-load the 3 MRI cases so demo works without upload.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/fe7da38c-4405-50ac-aab5-45e815488888).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
