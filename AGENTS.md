<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# AGENTS.md

- Demo MRI cases are synthesized procedurally in `src/lib/mri-render.ts` from a 3D volume function so all views stay consistent and no large DICOM files ship. Why: demo must work offline without uploads.
- AI pipeline (agents, findings) is simulated client-side from case data in `src/lib/cases.ts`. Why: no backend; keep case content in one place.
- Hospital PDF is drawn directly with jsPDF in `src/lib/report-pdf.ts` (dynamic import, browser only). Why: crisp vector text, no SSR issues.
- Only Modality=MR is accepted on upload (`src/lib/dicom.ts`). Why: project scope is MRI-only.
