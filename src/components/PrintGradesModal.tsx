// --- START OF FILE PrintGradesModal.tsx ---

import { useState } from 'react';
import type { FormEvent } from 'react';
import { X, Download, Printer as PrinterIcon } from 'lucide-react';
import type { Course } from '../types';
import PrintPreview from './PrintPreview';
import domtoimage from 'dom-to-image-more';
import { getPrintHTML } from './PrintHTMLBuilder';
import './PrintStyles.css';

interface PrintGradesModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: Course[];
  term: number;
  gpa: number;
  totalUnits: number;
  totalNASUnits: number;
  isDeansLister: boolean;
  isFirstHonors: boolean;
}

const PrintGradesModal = ({
  isOpen, onClose, courses, term, gpa,
  totalUnits, totalNASUnits, isDeansLister,
  isFirstHonors
}: PrintGradesModalProps) => {
  const [step, setStep] = useState<'info' | 'preview'>('info');
  const [name, setName] = useState('');
  const [degree, setDegree] = useState('');
  const [size, setSize] = useState<'standard' | 'story'>('standard');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  if (!isOpen) return null;

  const handleSubmitInfo = (e: FormEvent) => { e.preventDefault(); setStep('preview'); };
  const handleBack = () => setStep('info');

  const handleSizeChange = (newSize: 'standard' | 'story') => {
    setSize(newSize);
    if (newSize === 'story' && orientation !== 'portrait') setOrientation('portrait');
    if (step === 'preview') setTimeout(() => { setStep('info'); setTimeout(() => setStep('preview'), 10); }, 10);
  };

  const handleOrientationChange = (newOrientation: 'portrait' | 'landscape') => {
    setOrientation(newOrientation);
    if (step === 'preview') setTimeout(() => { setStep('info'); setTimeout(() => setStep('preview'), 10); }, 10);
  };

  // The scale applied to the preview wrapper in the modal
  const modalScale = size === 'story' ? 0.28 : 0.42;

  // ── Build a self-contained print page (no app CSS, no outerHTML copy) ──
  const buildPrintPage = () => {
    const layout: 'story' | 'portrait' | 'landscape' =
      size === 'story' ? 'story' : orientation === 'landscape' ? 'landscape' : 'portrait';
    const html = getPrintHTML(courses, term, gpa, totalUnits, totalNASUnits, isDeansLister, isFirstHonors, name, degree, layout);
    const pageSize = layout === 'story' ? '1080px 1920px' : layout === 'landscape' ? 'landscape' : 'portrait';

    return `<!DOCTYPE html>
      <html><head><title>Grades — Term ${term}</title>
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
        <style>
          @page { size: ${pageSize}; margin: 0; }
          *, *::before, *::after { margin: 0; padding: 0; border: none; outline: none; box-shadow: none; }
          *:not(table):not(thead):not(tbody):not(tr):not(th):not(td) { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          table { border-collapse: collapse; }
          html, body { width: 100%; height: 100%; overflow: hidden; }
        </style>
      </head><body>${html}</body></html>`;
  };

  // ── Print via browser: write self-contained page to new window ──
  const handlePrint = () => {
    const w = window.open('', '_blank');
    if (!w) { alert('Please allow pop-ups to print.'); return; }

    w.document.write(buildPrintPage());
    w.document.close();
    w.onload = () => setTimeout(() => { w.print(); }, 500);
  };

  // ── Download via dom-to-image-more (iframe-isolated to prevent app CSS leaking) ──
  const handleDownload = async () => {
    const layout: 'story' | 'portrait' | 'landscape' =
      size === 'story' ? 'story' : orientation;

    const dims = {
      story: { width: 1080, height: 1920 },
      portrait: { width: 816, height: 1056 },
      landscape: { width: 1056, height: 816 },
    } as const;
    const d = dims[layout];

    const html = getPrintHTML(courses, term, gpa, totalUnits, totalNASUnits, isDeansLister, isFirstHonors, name, degree, layout);

    // Create an off-screen iframe to isolate from app CSS (Tailwind, borders, box-sizing, etc.)
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.left = '0';
    iframe.style.top = '0';
    iframe.style.width = `${d.width}px`;
    iframe.style.height = `${d.height}px`;
    iframe.style.border = 'none';
    iframe.style.opacity = '1';              // must be visible for dom-to-image
    iframe.style.pointerEvents = 'none';
    iframe.style.zIndex = '-1';
    iframe.style.overflow = 'hidden';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      document.body.removeChild(iframe);
      alert('Could not create isolated render context.');
      return;
    }

    // Write the same self-contained page used by the print/PDF path
    // Use @import inside <style> so fonts block rendering (unlike <link> which is async)
    iframeDoc.open();
    iframeDoc.write(`<!DOCTYPE html>
      <html><head>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');
          *, *::before, *::after { margin: 0; padding: 0; border: none; outline: none; box-shadow: none; box-sizing: border-box; }
          html, body { width: ${d.width}px; height: ${d.height}px; overflow: hidden; background: #fff; }
        </style>
      </head><body>${html}</body></html>`);
    iframeDoc.close();

    // Actively wait for fonts to load inside the iframe
    const waitForFonts = async () => {
      const maxWait = 5000;
      const start = Date.now();
      while (Date.now() - start < maxWait) {
        try {
          const ready = await Promise.race([
            iframeDoc.fonts?.ready,
            new Promise(r => setTimeout(r, 200)),
          ]);
          if (ready && iframeDoc.fonts?.status === 'loaded') break;
        } catch { /* continue polling */ }
        await new Promise(r => setTimeout(r, 100));
      }
    };
    await waitForFonts();

    const target = iframeDoc.getElementById('print-preview') || iframeDoc.body;

    try {
      const dataUrl = await domtoimage.toPng(target, {
        width: d.width,
        height: d.height,
        quality: 1.0,
      });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `Greendex_Term${term}_Grades.png`;
      link.click();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('dom-to-image error:', message);
      alert('An error occurred while generating the image.');
    } finally {
      document.body.removeChild(iframe);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 print:hidden">
      <div className="bg-[#111916] rounded-lg p-4 sm:p-6 max-w-5xl w-full mx-2 sm:mx-4 max-h-[90vh] overflow-auto print-modal-content">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-dlsu-green">Print Grades</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200"><X size={24} /></button>
        </div>

        {step === 'info' ? (
          <form onSubmit={handleSubmitInfo} className="space-y-4">
            <div>
              <p className="text-sm text-gray-400 mb-4">
                Add your personal details below. This will only appear on the printed document.
              </p>
              <div className="space-y-3">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-200 mb-1">Full Name (Optional)</label>
                  <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border border-[#2D3B33] rounded bg-[#0A0F0D] text-white" placeholder="e.g., Juan Dela Cruz" />
                </div>
                <div>
                  <label htmlFor="degree" className="block text-sm font-medium text-gray-200 mb-1">Degree Program (Optional)</label>
                  <input type="text" id="degree" value={degree} onChange={e => setDegree(e.target.value)} className="w-full p-2 border border-[#2D3B33] rounded bg-[#0A0F0D] text-white" placeholder="e.g., BS Computer Science" />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-md font-medium text-gray-200 mb-2">Document Options</h3>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="sm:w-1/2">
                  <label className="block text-sm font-medium text-gray-200 mb-2">Size</label>
                  <div className="space-y-2">
                    {(['standard', 'story'] as const).map(s => (
                      <label key={s} className="flex items-center p-3 border border-[#2D3B33] rounded-lg cursor-pointer hover:bg-white/5 transition-colors">
                        <input type="radio" name="size" value={s} checked={size === s} onChange={() => handleSizeChange(s)} className="mr-3 h-4 w-4 accent-[#00E09A]" />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm text-gray-200">{s === 'story' ? 'IG/FB Story' : 'Standard (Letter/A4)'}</div>
                          <div className="text-xs text-gray-400">{s === 'story' ? 'Perfect for social media' : 'Best for physical printing'}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="sm:w-1/2">
                  <label className="block text-sm font-medium text-gray-200 mb-2">Orientation</label>
                  <div className="space-y-2">
                    {(['portrait', 'landscape'] as const).map(o => (
                      <label key={o} className={`flex items-center p-3 border border-[#2D3B33] rounded-lg transition-colors ${size === 'story' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-white/5'}`}>
                        <input type="radio" name="orientation" value={o} checked={orientation === o} onChange={() => handleOrientationChange(o)} className="mr-3 h-4 w-4 accent-[#00E09A]" disabled={size === 'story'} />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm text-gray-200">{o.charAt(0).toUpperCase() + o.slice(1)}</div>
                          <div className="text-xs text-gray-400">{o === 'portrait' ? 'Vertical (8.5" x 11")' : 'Horizontal (11" x 8.5")'}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button type="submit" className="px-4 py-2 bg-dlsu-green text-black font-semibold rounded hover:opacity-90 transition-opacity">Continue to Preview</button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-md font-medium text-gray-200">Preview</h3>
              <button onClick={handleBack} className="text-sm text-dlsu-green hover:text-dlsu-light-green flex items-center"><span className="mr-1">Edit details</span></button>
            </div>

            {/* Preview area — the PrintPreview element lives here at full resolution, scaled via CSS */}
            <div className="overflow-auto max-h-[60vh] flex justify-center items-start p-4 bg-[#162019] rounded print-preview-container">
              <div style={{ transform: `scale(${modalScale})`, transformOrigin: 'top center', display: 'inline-block' }}>
                <PrintPreview
                  courses={courses} term={term} gpa={gpa}
                  totalUnits={totalUnits} totalNASUnits={totalNASUnits}
                  isDeansLister={isDeansLister} isFirstHonors={isFirstHonors}
                  name={name} degree={degree}
                  size={size} orientation={orientation}
                />
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row justify-between gap-3">
              <button onClick={handleBack} className="px-4 py-2 border border-[#2D3B33] rounded text-gray-300 hover:bg-white/5 transition-colors">Back</button>
              <div className="flex flex-col sm:flex-row gap-2">
                <button onClick={handlePrint} className="px-4 py-2 bg-dlsu-green text-black font-semibold rounded hover:opacity-90 transition-opacity flex items-center justify-center">
                  <PrinterIcon size={18} className="mr-1" /> Print
                </button>
                <button onClick={handleDownload} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center justify-center">
                  <Download size={18} className="mr-1" /> Download as Image
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrintGradesModal;
// --- END OF FILE PrintGradesModal.tsx ---
