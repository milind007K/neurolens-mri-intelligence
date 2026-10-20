export type Region = "brain" | "knee";
export type Triage = "ROUTINE" | "URGENT" | "CRITICAL";

export interface MriCase {
  id: string;
  code: string;
  label: string;
  region: Region;
  mriType: string;
  confidence: number;
  diagnosis: string;
  icd: string;
  triage: Triage;
  patient: { name: string; age: number; sex: "M" | "F"; id: string; referring: string };
  dicom: {
    studyDate: string;
    modality: "MR";
    sliceThickness: string;
    tr: string;
    te: string;
    field: string;
    manufacturer: string;
    series: string;
    bodyPart: string;
  };
  history: string;
  technique: string;
  findings: string[];
  impression: string;
  nextSteps: string[];
  prognosis: string;
  followUp: string[];
  reasoning: string[];
  lesion?: { center: [number, number, number]; r: number; label: string; volume: string };
  metrics: { dice: number; inference: string };
}

export const CASES: MriCase[] = [
  {
    id: "brain-normal",
    code: "A",
    label: "Brain MRI — Normal Study",
    region: "brain",
    mriType: "MRI BRAIN (PLAIN)",
    confidence: 98,
    diagnosis: "No acute intracranial abnormality",
    icd: "Z03.89",
    triage: "ROUTINE",
    patient: { name: "Rahul Deshmukh", age: 34, sex: "M", id: "RCM-24-10871", referring: "Dr. S. Kulkarni (Neurology)" },
    dicom: { studyDate: "2026-10-18", modality: "MR", sliceThickness: "5.0 mm", tr: "2200 ms", te: "95 ms", field: "3.0 T", manufacturer: "SIEMENS MAGNETOM Vida", series: "AX T2 TSE / FLAIR / DWI", bodyPart: "BRAIN" },
    history: "History of chronic intermittent headache for 3 months. No focal neurological deficit. No history of trauma or seizures.",
    technique: "MRI Brain was performed on a 3T scanner using multiplanar multisequence imaging including T1W, T2W, FLAIR, DWI/ADC and SWI sequences. No intravenous contrast was administered.",
    findings: [
      "Cerebral hemispheres show normal grey-white matter differentiation with no focal signal abnormality.",
      "No evidence of acute infarct; no diffusion restriction on DWI/ADC.",
      "Lateral, third and fourth ventricles are normal in size and configuration. Midline structures are central.",
      "Basal ganglia, thalami, brainstem and cerebellum appear normal.",
      "No intra- or extra-axial collection, haemorrhage or mass lesion. No blooming on SWI.",
      "Sellar and parasellar regions are normal. Visualised paranasal sinuses and mastoids are clear.",
    ],
    impression: "No significant intracranial abnormality detected. Normal MRI study of the brain.",
    nextSteps: ["Clinical correlation with neurologist", "Headache diary and symptomatic management", "No further imaging required at present"],
    prognosis: "Excellent. No structural cause for headache identified.",
    followUp: ["Neurology OPD review in 4 weeks", "Repeat imaging only if new red-flag symptoms"],
    reasoning: [
      "Segmentation: MONAI UNet returned no lesion voxels above threshold (p<0.02).",
      "BiomedCLIP zero-shot: 'normal brain MRI' similarity 0.98 vs 'tumor' 0.03.",
      "RAG (ACR Appropriateness Criteria – Headache): no red flags -> no follow-up imaging.",
    ],
    metrics: { dice: 0.97, inference: "5.4 s" },
  },
  {
    id: "brain-glioma",
    code: "B",
    label: "Brain MRI — Glioma, Left Frontal Lobe",
    region: "brain",
    mriType: "MRI BRAIN WITH CONTRAST",
    confidence: 92,
    diagnosis: "High-Grade Glioma (WHO Grade IV), left frontal lobe",
    icd: "C71.1",
    triage: "CRITICAL",
    patient: { name: "Sunita Patil", age: 52, sex: "F", id: "RCM-24-11392", referring: "Dr. A. Joshi (Neurosurgery)" },
    dicom: { studyDate: "2026-10-19", modality: "MR", sliceThickness: "3.0 mm", tr: "4500 ms", te: "102 ms", field: "3.0 T", manufacturer: "GE SIGNA Architect", series: "AX T1 POST GAD / FLAIR / DWI", bodyPart: "BRAIN" },
    history: "History of progressive headache and two episodes of generalised seizures over 3 weeks. Recent onset right-sided weakness.",
    technique: "MRI Brain was performed on a 3T scanner using T1W, T2W, FLAIR, DWI/ADC, SWI and post-contrast T1W (Gadolinium 0.1 mmol/kg) sequences in axial, sagittal and coronal planes.",
    findings: [
      "A well-defined heterogeneous intra-axial lesion measuring 3.2 x 2.8 x 3.0 cm is noted in the left frontal lobe.",
      "The lesion shows thick irregular peripheral (rim) enhancement with central non-enhancing necrotic component.",
      "Extensive perilesional vasogenic oedema on FLAIR extending into the left corona radiata.",
      "Mass effect with effacement of adjacent sulci and compression of the frontal horn of left lateral ventricle; midline shift of ~4 mm to the right.",
      "Areas of diffusion restriction in the solid enhancing rim. Foci of blooming on SWI suggestive of intralesional haemorrhage.",
      "Rest of the brain parenchyma, posterior fossa structures and ventricular system are unremarkable.",
    ],
    impression: "Findings are suggestive of High-Grade Glioma (WHO Grade IV / Glioblastoma) in the left frontal lobe with perilesional oedema and mass effect.",
    nextSteps: ["Neurosurgery consult URGENTLY (within 24 h)", "MR Spectroscopy and MR Perfusion (rCBV)", "Stereotactic biopsy / maximal safe resection with histopathology + IDH/MGMT", "Start dexamethasone and anti-epileptics as per neurology"],
    prognosis: "Guarded. Median survival 14–16 months with Stupp protocol (surgery + RT 60 Gy + temozolomide).",
    followUp: ["Day 0–2: Neurosurgical evaluation & steroids", "Week 1–2: Biopsy / resection", "Week 4–6: Concurrent chemo-radiotherapy", "Every 3 months: RANO follow-up MRI"],
    reasoning: [
      "Segmentation: MONAI UNet (BraTS-trained) -> enhancing tumour 14.2 cc, necrosis 3.1 cc, oedema 38.6 cc.",
      "Grad-CAM peak at left frontal lobe (MNI -24, 38, 22). BiomedCLIP 'glioblastoma' similarity 0.92.",
      "RAG (NCCN CNS Cancers v2.2025, PubMed PMID 15758009): rim enhancement + necrosis -> HGG; recommend tissue diagnosis.",
      "Triage rule: mass effect + midline shift >3 mm -> CRITICAL.",
    ],
    lesion: { center: [0.34, -0.42, 0.22], r: 0.2, label: "Glioma 3.2×2.8 cm", volume: "14.2 cc" },
    metrics: { dice: 0.91, inference: "6.8 s" },
  },
  {
    id: "knee-acl",
    code: "C",
    label: "Knee MRI — ACL Tear + Meniscus Injury",
    region: "knee",
    mriType: "MRI RIGHT KNEE (PLAIN)",
    confidence: 95,
    diagnosis: "Complete ACL tear with medial meniscus posterior horn tear",
    icd: "S83.511A",
    triage: "URGENT",
    patient: { name: "Aditya Wankhede", age: 24, sex: "M", id: "RCM-24-11408", referring: "Dr. P. Bhoyar (Orthopaedics)" },
    dicom: { studyDate: "2026-10-20", modality: "MR", sliceThickness: "3.0 mm", tr: "3000 ms", te: "35 ms", field: "1.5 T", manufacturer: "PHILIPS Ingenia", series: "SAG PD FS / COR T1 / AX T2", bodyPart: "KNEE" },
    history: "Twisting injury to right knee while playing football 10 days ago. Pain, swelling and instability ('giving way').",
    technique: "MRI of the right knee was performed on a 1.5T scanner using PD fat-saturated, T1W and T2W sequences in sagittal, coronal and axial planes.",
    findings: [
      "Anterior cruciate ligament shows complete discontinuity in its mid-substance with wavy, lax fibres and surrounding hyperintense oedema.",
      "Horizontal-oblique linear hyperintense signal in the posterior horn of the medial meniscus reaching the inferior articular surface (Grade III tear).",
      "Bone marrow oedema (bone bruise) in the lateral femoral condyle and posterolateral tibial plateau — 'kissing contusion' pattern.",
      "Moderate joint effusion with distension of the suprapatellar recess.",
      "PCL, MCL, LCL and extensor mechanism are intact. Articular cartilage is preserved.",
    ],
    impression: "Complete tear of the anterior cruciate ligament with Grade III tear of posterior horn of medial meniscus, bone contusions and joint effusion.",
    nextSteps: ["Orthopaedic / sports-medicine consult within 1 week", "Knee brace, RICE protocol and pre-hab physiotherapy", "Arthroscopic ACL reconstruction with meniscal repair once swelling resolves"],
    prognosis: "Good. >90% return to sport after ACL reconstruction with structured rehabilitation (9–12 months).",
    followUp: ["Week 1: Ortho consult", "Week 3–6: Arthroscopic reconstruction", "Month 3: Rehab milestone review", "Month 9–12: Return-to-sport assessment"],
    reasoning: [
      "Segmentation: MONAI UNet (knee-SKI10) -> ACL fibre continuity score 0.08 (torn).",
      "Grad-CAM peak at intercondylar notch; secondary peak at medial meniscus posterior horn.",
      "RAG (AAOS Clinical Practice Guideline: ACL Injury 2022): young active patient -> reconstruction recommended.",
    ],
    lesion: { center: [0.01, 0.0, 0.02], r: 0.13, label: "ACL tear", volume: "2.4 cc" },
    metrics: { dice: 0.93, inference: "6.1 s" },
  },
];

export const getCase = (id: string) => CASES.find((c) => c.id === id);
