import type { Course } from '../types';

// ── HTML helpers ──

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const trophySVG = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2"/><path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2"/><path d="M6 3h12v7a6 6 0 0 1-12 0V3z"/><path d="M9 21h6"/><path d="M12 16v5"/></svg>`;

const LOGO = `<img src="/greendex-icon.svg" width="44" height="44" alt="" style="display:block;flex-shrink:0;" />`;

// ── Data helpers ──

interface PrintData {
  courses: Course[];
  term: number;
  gpa: number;
  totalUnits: number;
  totalNASUnits: number;
  isDeansLister: boolean;
  isFirstHonors: boolean;
  name: string;
  degree: string;
}

function formatGrade(c: Course): string {
  if (c.nas && c.units === 0) return c.grade > 0 ? 'P' : 'F';
  return c.grade.toFixed(1);
}

function formatUnits(c: Course): string {
  if (c.nas) return `(${c.units})`;
  return String(c.units);
}


// ── Layout templates ──

export function getPrintHTML(
  courses: Course[], term: number, gpa: number,
  totalUnits: number, totalNASUnits: number,
  isDeansLister: boolean, isFirstHonors: boolean,
  name: string, degree: string,
  layout: 'story' | 'portrait' | 'landscape'
): string {
  return buildPageHTML(
    { courses, term, gpa, totalUnits, totalNASUnits, isDeansLister, isFirstHonors, name, degree },
    layout
  );
}

function buildPageHTML(p: PrintData, layout: 'story' | 'portrait' | 'landscape'): string {
  const gpaVal = typeof p.gpa === 'number' ? p.gpa.toFixed(3) : String(p.gpa);
  const deansShort = p.isFirstHonors ? 'First Honors' : 'Second Honors';
  const escName = esc(p.name);
  const escDegree = esc(p.degree);
  const escTerm = `Term ${p.term} Grades`;

  const tableRows = p.courses.map((c) => {
    const gr = formatGrade(c);
    const un = formatUnits(c);
    const fontSize = layout === 'story' ? '22px' : '15px';
    const unitFontSize = layout === 'story' ? '18px' : '13px';
    const gradeFontSize = layout === 'story' ? '22px' : '20px';

    const style = `font-size:${fontSize};color:#2a4a38;padding:12px 8px;font-weight:300;`;
    const unitStyle = `font-size:${unitFontSize};color:#6a8a78;padding:12px 8px;text-align:right;font-weight:300;`;
    const gradeStyle = `font-family:'Cormorant Garamond',serif;font-size:${gradeFontSize};font-weight:600;color:#1a3a2a;padding:12px 8px;text-align:right;`;
    return `<tr style="border-bottom:0.5px solid #e8efe5;">
      <td style="${style}">${esc(c.code || '-')}</td>
      <td style="${unitStyle}">${un}</td>
      <td style="${gradeStyle}">${gr}</td>
    </tr>`;
  }).join('');

  if (layout === 'story') return buildStory(p, escName, escDegree, escTerm, gpaVal, deansShort, tableRows);
  if (layout === 'portrait') return buildPortrait(p, escName, escDegree, escTerm, gpaVal, deansShort, trophySVG, tableRows);
  return buildLandscape(p, escName, escDegree, escTerm, gpaVal, deansShort, trophySVG, tableRows);
}

// ═══════════════════════════════════════════════════════════
// STORY (1080 × 1920)
// ═══════════════════════════════════════════════════════════

function buildStory(
  p: PrintData, escName: string, escDegree: string, escTerm: string, gpaVal: string,
  _deansShort: string, tableRows: string
): string {
  const nameBlock = p.name
    ? `<div style="font-family:'Cormorant Garamond',serif;font-size:48px;font-weight:300;color:#fff;line-height:1.1;word-wrap:break-word;overflow-wrap:break-word;">${escName}</div>`
    : '';

  const storyDeansLabel = p.isFirstHonors ? "First Honor's Dean's Lister" : "Second Honor's Dean's Lister";

  const badgeBlock = p.isDeansLister
    ? `<div style="display:flex;align-items:center;gap:20px;padding:28px 36px;background:#f4f8f5;border-bottom:0.5px solid #e2ebe5;">
        <div style="width:64px;height:56px;background:#1a3a2a;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#a8d4b8;">${trophySVG}</div>
        <div>
          <div style="font-size:20px;letter-spacing:0.14em;text-transform:uppercase;color:#7a9585;margin-bottom:4px;">Achievement</div>
          <div style="font-family:'Cormorant Garamond',serif;font-size:28px;font-style:italic;font-weight:400;color:#1a3a2a;line-height:1.1;white-space:nowrap;">${storyDeansLabel}</div>
        </div>
      </div>`
    : '';

  return `
<div id="print-preview" style="width:1080px;height:1920px;background:#fff;font-family:'DM Sans',sans-serif;display:flex;flex-direction:column;overflow:hidden;border:0;outline:0;">

  <!-- HERO -->
  <div style="background:#1a3a2a;padding:48px 44px 40px;position:relative;overflow:hidden;flex-shrink:0;">
    <div style="position:absolute;top:-30px;right:-30px;width:260px;height:260px;border-radius:50%;background:rgba(255,255,255,0.04);"></div>
    <div style="position:absolute;bottom:-50px;right:-20px;width:180px;height:180px;border-radius:50%;background:rgba(255,255,255,0.03);"></div>
    <div style="display:flex;align-items:center;margin-bottom:24px;">${LOGO}</div>
    ${nameBlock}
    <div style="font-size:12px;color:#6a9a7a;letter-spacing:0.12em;text-transform:uppercase;margin-top:12px;">${escDegree}</div>
  </div>

  <!-- GPA -->
  <div style="padding:36px 44px 32px;background:#fff;border-bottom:0.5px solid #e2ebe5;flex-shrink:0;">
    <div style="font-size:20px;letter-spacing:0.14em;text-transform:uppercase;color:#7a9585;margin-bottom:8px;">Grade Point Average</div>
    <div style="font-family:'Cormorant Garamond',serif;font-size:120px;font-weight:300;color:#1a3a2a;line-height:1;letter-spacing:-0.02em;">${gpaVal}</div>
    <div style="font-size:20px;color:#9ab0a0;margin-top:8px;">Total Units: ${p.totalUnits}${p.totalNASUnits > 0 ? ` · ${p.totalNASUnits} NAS` : ''}</div>
  </div>

  <!-- BADGE -->
  ${badgeBlock}

  <!-- TABLE -->
  <div style="padding:28px 44px 20px;flex:1;display:flex;flex-direction:column;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
      <div style="font-size:18px;letter-spacing:0.16em;text-transform:uppercase;color:#7a9585;white-space:nowrap;">Academic Record</div>
      <div style="font-size:20px;color:#9ab0a0;background:#f0f5f2;padding:4px 14px;border-radius:100px;">${escTerm}</div>
    </div>
    <table style="width:100%;border-collapse:collapse;">
      <thead><tr style="border-bottom:0.5px solid #c8d4cb;">
        <th style="font-size:20px;letter-spacing:0.14em;text-transform:uppercase;color:#7a9585;font-weight:400;padding:0 0 10px;text-align:left;">Course</th>
        <th style="font-size:20px;letter-spacing:0.14em;text-transform:uppercase;color:#7a9585;font-weight:400;padding:0 0 10px;text-align:right;">Units</th>
        <th style="font-size:20px;letter-spacing:0.14em;text-transform:uppercase;color:#7a9585;font-weight:400;padding:0 0 10px;text-align:right;">Grade</th>
      </tr></thead>
      <tbody style="font-size:28px">${tableRows}</tbody>
    </table>
    <div style="flex:1;"></div>
  </div>

  <!-- FOOTER -->
  <div style="padding:18px 44px;border-top:0.5px solid #e2ebe5;background:#fff;flex-shrink:0;">
    <div style="font-size:16px;color:#b0c4b8;font-style:italic;">Generated using <strong style="font-style:normal;color:#6a8a78;">Greendex DLSU GPA Calculator.</strong> Not officially affiliated with De La Salle University.</div>
  </div>
  <div style="height:6px;background:#1a3a2a;flex-shrink:0;"></div>
</div>`;
}

// ═══════════════════════════════════════════════════════════
// PORTRAIT (816 × 1056)
// ═══════════════════════════════════════════════════════════

function buildPortrait(
  p: PrintData, escName: string, escDegree: string, escTerm: string, gpaVal: string,
  deansShort: string, trophySVG: string, tableRows: string
): string {
  const nameBlock = `<div style="font-family:'Cormorant Garamond',serif;font-size:36px;font-weight:300;color:#1a3a2a;line-height:1.1;word-wrap:break-word;overflow-wrap:break-word;">${escName}</div>`;

  const badgeBlock = p.isDeansLister
    ? `<div style="background:#1a3a2a;border-radius:8px;padding:20px 32px;text-align:center;flex-shrink:0;">
        <div style="color:#a8d4b8;margin-bottom:8px;display:inline-block;">${trophySVG}</div>
        <div style="font-family:'Cormorant Garamond',serif;font-size:24px;color:#fff;line-height:1.1;white-space:nowrap;">${deansShort}</div>
        <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#a8c4b4;margin-top:4px;">Dean's Lister</div>
      </div>`
    : '';

  return `
<div id="print-preview" style="width:816px;height:1056px;background:#fff;font-family:'DM Sans',sans-serif;display:flex;flex-direction:column;overflow:hidden;border:0;outline:0;">

  <!-- TOP BAR -->
  <div style="height:8px;background:#1a3a2a;width:100%;flex-shrink:0;"></div>

  <div style="display:flex;flex-direction:column;flex:1;padding:32px 48px 20px;">
    <!-- HEADER -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:18px;border-bottom:0.5px solid #c8d4cb;">
      <div style="flex:1;min-width:0;">
        <div style="width:52px;height:52px;background:#1a3a2a;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-bottom:8px;overflow:hidden;">${LOGO}</div>
        ${nameBlock}
        <div style="font-size:11px;color:#7a9585;letter-spacing:0.12em;text-transform:uppercase;margin-top:8px;">${escDegree}</div>
      </div>
      <div style="text-align:right;padding-top:8px;flex-shrink:0;margin-left:24px;">
        <div style="font-size:11px;color:#9ab0a0;letter-spacing:0.12em;text-transform:uppercase;">Term</div>
        <div style="font-size:15px;color:#3a5a48;font-weight:500;margin-top:3px;">${escTerm}</div>
      </div>
    </div>

    <!-- GPA + BADGE -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;gap:20px;">
      <div style="flex:1;">
        <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#7a9585;margin-bottom:6px;">Grade Point Average</div>
        <div style="font-family:'Cormorant Garamond',serif;font-size:100px;font-weight:300;color:#1a3a2a;line-height:1;letter-spacing:-0.02em;">${gpaVal}</div>
        <div style="font-size:14px;color:#9ab0a0;margin-top:6px;">Total Units: ${p.totalUnits}${p.totalNASUnits > 0 ? ` (${p.totalNASUnits} NAS)` : ''}</div>
      </div>
      ${badgeBlock}
    </div>

    <!-- SECTION DIVIDER -->
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px;">
      <span style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#7a9585;white-space:nowrap;">Academic Record</span>
      <div style="flex:1;height:0.5px;background:#c8d4cb;"></div>
    </div>

    <!-- TABLE -->
    <table style="width:100%;border-collapse:collapse;">
      <thead><tr style="border-bottom:0.5px solid #c8d4cb;">
        <th style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#7a9585;font-weight:400;padding:0 0 10px;text-align:left;">Course</th>
        <th style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#7a9585;font-weight:400;padding:0 0 10px;text-align:right;">Units</th>
        <th style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#7a9585;font-weight:400;padding:0 0 10px;text-align:right;">Grade</th>
      </tr></thead>
      <tbody>${tableRows}</tbody>
    </table>

    <div style="flex:1;"></div>

    <!-- FOOTER -->
    <div style="border-top:0.5px solid #c8d4cb;padding-top:14px;">
      <div style="font-size:10px;color:#b0c4b8;font-style:italic;white-space:nowrap;">Generated using <strong style="font-style:normal;color:#8a9a88;">Greendex DLSU GPA Calculator.</strong> Not officially affiliated with De La Salle University.</div>
    </div>
  </div>

  <!-- BOTTOM BAR -->
  <div style="height:6px;background:linear-gradient(90deg, #1a3a2a 60%, #3a7a55 100%);flex-shrink:0;"></div>
</div>`;
}

// ═══════════════════════════════════════════════════════════
// LANDSCAPE (1056 × 816)
// ═══════════════════════════════════════════════════════════

function buildLandscape(
  p: PrintData, escName: string, escDegree: string, escTerm: string, gpaVal: string,
  deansShort: string, trophySVG: string, tableRows: string
): string {
  const nameBlock = p.name
    ? `<div style="font-family:'Cormorant Garamond',serif;font-size:32px;font-weight:300;color:#fff;line-height:1.1;word-wrap:break-word;overflow-wrap:break-word;">${escName}</div>`
    : '';

  const badgeBlock = p.isDeansLister
    ? `<div style="border:0.5px solid #3a6a50;border-radius:8px;padding:18px 16px;text-align:center;margin-bottom:20px;">
        <div style="width:36px;height:36px;margin:0 auto 8px;display:block;color:#a8d4b8;">${trophySVG}</div>
        <div style="font-family:'Cormorant Garamond',serif;font-size:22px;font-style:italic;color:#fff;line-height:1.1;">${deansShort}</div>
        <div style="font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#7ab090;margin-top:4px;">Dean's Lister</div>
      </div>`
    : '';

  return `
<div id="print-preview" style="width:1056px;height:816px;background:#fff;font-family:'DM Sans',sans-serif;display:flex;overflow:hidden;border:0;outline:0;">

  <!-- LEFT PANEL -->
  <div style="width:380px;background:#1a3a2a;display:flex;flex-direction:column;padding:36px 32px;flex-shrink:0;position:relative;overflow:hidden;">
    <div style="position:absolute;bottom:-40px;left:-40px;width:200px;height:200px;border-radius:50%;background:rgba(255,255,255,0.03);"></div>
    <div style="position:absolute;top:45%;right:-40px;width:100px;height:100px;border-radius:50%;background:rgba(255,255,255,0.03);"></div>

    <div style="margin-bottom:28px;">${LOGO}</div>
    ${nameBlock}
    <div style="font-size:11px;color:#7ab090;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:24px;word-wrap:break-word;overflow-wrap:break-word;">${escDegree}</div>

    <div style="margin-bottom:20px;">
      <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#6a9a7a;margin-bottom:6px;">GPA</div>
      <div style="font-family:'Cormorant Garamond',serif;font-size:80px;font-weight:300;color:#fff;line-height:1;letter-spacing:-0.02em;">${gpaVal}</div>
      <div style="font-size:13px;color:#6a9a7a;margin-top:6px;">Total Units: ${p.totalUnits}${p.totalNASUnits > 0 ? ` (${p.totalNASUnits} NAS)` : ''}</div>
    </div>

    ${badgeBlock}

    <div style="flex:1;"></div>
    
  </div>

  <!-- RIGHT PANEL -->
  <div style="flex:1;display:flex;flex-direction:column;padding:32px 40px 24px;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;padding-bottom:14px;border-bottom:0.5px solid #c8d4cb;">
      <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#7a9585;white-space:nowrap;">Academic Record</div>
      <div style="font-size:13px;color:#9ab0a0;">${escTerm}</div>
    </div>

    <table style="width:100%;border-collapse:collapse;">
      <thead><tr style="border-bottom:0.5px solid #c8d4cb;">
        <th style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#7a9585;font-weight:400;padding:0 0 10px;text-align:left;">Course</th>
        <th style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#7a9585;font-weight:400;padding:0 0 10px;text-align:right;">Units</th>
        <th style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#7a9585;font-weight:400;padding:0 0 10px;text-align:right;">Grade</th>
      </tr></thead>
      <tbody>${tableRows}</tbody>
    </table>

    <div style="flex:1;"></div>

    <!-- FOOTER -->
    <div style="border-top:0.5px solid #c8d4cb;padding-top:12px;display:flex;justify-content:space-between;align-items:flex-end;">
      <div style="font-size:10px;color:#b0c4b8;font-style:italic;max-width:4in;line-height:1.5;white-space:nowrap;">Generated using <strong style="font-style:normal;color:#8a9a88;">Greendex DLSU GPA Calculator.</strong> Not officially affiliated with De La Salle University.</div>
    </div>
  </div>
</div>`;
}
