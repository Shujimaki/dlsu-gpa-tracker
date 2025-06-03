// --- START OF FILE PrintGradesModal.tsx ---

import { useState, useRef } from 'react';
import type { FormEvent } from 'react';
import { X, Download, Printer as PrinterIcon } from 'lucide-react';
import type { Course } from '../types';
import PrintPreview from './PrintPreview';
// import html2canvas from 'html2canvas'; // Remove html2canvas import
import domtoimage from 'dom-to-image-more'; // Import dom-to-image-more
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
  isFlowchartExempt: boolean;
}

const PrintGradesModal = ({
  isOpen,
  onClose,
  courses,
  term,
  gpa,
  totalUnits,
  totalNASUnits,
  isDeansLister,
  isFirstHonors,
  isFlowchartExempt
}: PrintGradesModalProps) => {
  const [step, setStep] = useState<'info' | 'preview'>('info');
  const [name, setName] = useState('');
  const [degree, setDegree] = useState('');
  const [size, setSize] = useState<'standard' | 'story'>('standard');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const previewContainerRef = useRef<HTMLDivElement>(null);
  
  // Reset preview when changing format to avoid layout issues
  const handleSizeChange = (newSize: 'standard' | 'story') => {
    // First set the size state
    setSize(newSize);
    
    // If IG/FB story is selected, automatically set orientation to portrait
    if (newSize === 'story' && orientation !== 'portrait') {
      setOrientation('portrait');
    }
    
    // Force re-render of preview component when in preview step
    if (step === 'preview') {
      // Set a brief timeout to ensure the state is updated
      setTimeout(() => {
        // Force a complete re-render by temporarily setting step to info and back
        setStep('info');
        setTimeout(() => {
          setStep('preview');
        }, 10);
      }, 10);
    }
  };
  
  const handleOrientationChange = (newOrientation: 'portrait' | 'landscape') => {
    // First set the orientation state
    setOrientation(newOrientation);
    
    // Force re-render of preview component when in preview step
    if (step === 'preview') {
      // Set a brief timeout to ensure the state is updated
      setTimeout(() => {
        // Force a complete re-render by temporarily setting step to info and back
        setStep('info');
        setTimeout(() => {
          setStep('preview');
        }, 10);
      }, 10);
    }
  };
  
  if (!isOpen) return null;
  
  const handleSubmitInfo = (e: FormEvent) => {
    e.preventDefault();
    setStep('preview');
  };
  
  const handleBack = () => {
    setStep('info');
  };
  
  // handlePrint remains the same as it uses browser's native print
  const handlePrint = () => {
    const printContentElement = document.getElementById('print-preview');
    if (!printContentElement) {
      console.error('Print preview element not found');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to print.');
      return;
    }

    const stylesArray = Array.from(document.styleSheets)
      .map(styleSheet => {
        try {
          return Array.from(styleSheet.cssRules)
            .map(rule => rule.cssText)
            .join('\n');
        } catch (e) { return ''; }
      });
    
    const styles = stylesArray.filter(style => style).join('\n');
    const printContentHTML = printContentElement.outerHTML;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Grades - Term ${term}</title>
          <style>
            @page {
              size: ${size === 'story' ? '1080px 1920px' : (orientation === 'landscape' ? 'landscape' : 'portrait')};
              margin: 0;
            }
            body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            ${styles}
            #print-preview {
              width: 100vw !important; height: 100vh !important; box-sizing: border-box !important; 
              margin: 0 !important; border: none !important; box-shadow: none !important;
              page-break-after: always; display: flex !important; flex-direction: column !important;
            }
            #print-preview > *:nth-child(1) { flex-shrink: 0 !important; } 
            #print-preview > *:nth-child(2) { flex-grow: 1 !important; display: flex !important; } 
            #print-preview > *:nth-child(3) { flex-shrink: 0 !important; margin-top: auto !important; } 
          </style>
        </head>
        <body>
          ${printContentHTML}
          <script>
            window.onload = function() { setTimeout(function() { window.print(); window.close(); }, 500); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownload = async () => {
    const previewElement = document.getElementById('print-preview');
    if (!previewElement) {
      console.error('Preview element not found for download.');
      return;
    }
    
    await document.fonts.ready;
  
    // Calculate dimensions for dom-to-image options
    const targetWidth = size === 'story' ? 1080 : orientation === 'portrait' ? Math.round(8.5 * 96) : Math.round(11 * 96);
    const targetHeight = size === 'story' ? 1920 : orientation === 'portrait' ? Math.round(11 * 96) : Math.round(8.5 * 96);
  
    // Create a temporary container for the styled clone
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'fixed';
    tempContainer.style.top = '-20000px';
    tempContainer.style.left = '-20000px';
    tempContainer.style.width = `${targetWidth}px`;
    tempContainer.style.height = `${targetHeight}px`;
    tempContainer.style.background = '#FFFFFF';
    tempContainer.style.overflow = 'hidden';
    tempContainer.style.border = 'none';
    tempContainer.style.outline = 'none';
    tempContainer.style.boxShadow = 'none';
    document.body.appendChild(tempContainer);
  
    // Clone the preview element
    const clone = previewElement.cloneNode(true) as HTMLElement;
    clone.style.transform = 'none';
    clone.style.width = '100%';
    clone.style.height = '100%';
    clone.style.position = 'absolute';
    clone.style.top = '0';
    clone.style.left = '0';
    clone.style.margin = '0';
    clone.style.border = 'none';
    clone.style.boxShadow = 'none';
    clone.style.outline = 'none';
    clone.style.display = 'flex';
    clone.style.flexDirection = 'column';
  
    // Remove all borders, outlines, and box shadows from all elements
    const allElements = clone.querySelectorAll('*');
    allElements.forEach(element => {
      const el = element as HTMLElement;
      el.style.border = 'none';
      el.style.outline = 'none';
      el.style.boxShadow = 'none';
      el.style.borderTop = 'none';
      el.style.borderBottom = 'none';
      el.style.borderLeft = 'none';
      el.style.borderRight = 'none';
    });
  
    // Handle table borders - ONLY keep row separators
    const tables = clone.querySelectorAll('table');
    tables.forEach(table => {
      const tableEl = table as HTMLElement;
      tableEl.style.borderCollapse = 'collapse';
      tableEl.style.outline = 'none';
      tableEl.style.boxShadow = 'none';
    });
  
    // Keep row separators but remove other borders
    const tableRows = clone.querySelectorAll('table tr');
    tableRows.forEach((row, index) => {
      const rowEl = row as HTMLElement;
      rowEl.style.outline = 'none';
      rowEl.style.boxShadow = 'none';
      
      // If it's a header row, add a bottom border
      if (row.querySelector('th')) {
        row.querySelectorAll('th').forEach(th => {
          const thEl = th as HTMLElement;
          thEl.style.border = 'none';
          thEl.style.borderBottom = '2px solid #e5e7eb'; // Restore header bottom border
        });
      } else {
        // For data rows, add bottom border (except the last row)
        if (index < tableRows.length - 1) {
          row.querySelectorAll('td').forEach(td => {
            const tdEl = td as HTMLElement;
            tdEl.style.border = 'none';
            tdEl.style.borderBottom = '1px solid #e5e7eb'; // Restore row separator
          });
        }
      }
    });
  
    const tableCells = clone.querySelectorAll('td, th');
    tableCells.forEach(cell => {
      const cellEl = cell as HTMLElement;
      cellEl.style.borderLeft = 'none';
      cellEl.style.borderRight = 'none';
      cellEl.style.outline = 'none';
      cellEl.style.boxShadow = 'none';
      cellEl.style.verticalAlign = 'middle';
    });
  
    // Remove grid gaps
    const gridContainers = clone.querySelectorAll('[class*="grid"]');
    gridContainers.forEach(container => {
      const containerEl = container as HTMLElement;
      containerEl.style.gap = '0';
      containerEl.style.gridGap = '0';
      containerEl.style.rowGap = '0';
      containerEl.style.columnGap = '0';
    });
  
    // Remove any background images that might show grids
    allElements.forEach(element => {
      const el = element as HTMLElement;
      if (el.style.backgroundImage && el.style.backgroundImage.includes('grid')) {
        el.style.backgroundImage = 'none';
      }
    });
  
    // Style text elements with proper line height and spacing
    const styleTextElement = (textEl: HTMLElement | null, lineHeight = '1.2') => {
      if (!textEl) return;
      textEl.style.margin = '0';
      textEl.style.padding = '0';
      textEl.style.lineHeight = lineHeight;
      textEl.style.border = 'none';
      textEl.style.outline = 'none';
      textEl.style.boxShadow = 'none';
    };
  
    // Header Area - ensure proper spacing and no text wrapping
    const headerArea = clone.children[0] as HTMLElement;
    if (headerArea) {
      headerArea.style.display = 'flex';
      headerArea.style.alignItems = 'center';
      headerArea.style.flexShrink = '0';
      headerArea.style.border = 'none';
      headerArea.style.outline = 'none';
      headerArea.style.boxShadow = 'none';
      headerArea.style.minHeight = '80px';
      headerArea.style.backgroundColor = '#006f51'; // Ensure green background
      
      const headerContentWrapper = headerArea.children[0] as HTMLElement;
      if (headerContentWrapper) {
        headerContentWrapper.style.display = 'flex';
        headerContentWrapper.style.alignItems = 'center';
        headerContentWrapper.style.justifyContent = 'space-between';
        headerContentWrapper.style.width = '100%';
        headerContentWrapper.style.padding = '0 20px';
        headerContentWrapper.style.border = 'none';
        headerContentWrapper.style.outline = 'none';
        headerContentWrapper.style.boxShadow = 'none';
        
        const headerLeft = headerContentWrapper.children[0] as HTMLElement;
        const headerRight = headerContentWrapper.children[1] as HTMLElement;
        
        if (headerLeft) {
          headerLeft.style.display = 'flex';
          headerLeft.style.alignItems = 'center';
          headerLeft.style.flex = '0 0 auto';
          headerLeft.style.maxWidth = '60%';
          headerLeft.style.whiteSpace = 'nowrap';
          headerLeft.style.overflow = 'hidden';
          headerLeft.style.textOverflow = 'ellipsis';
          headerLeft.style.border = 'none';
          headerLeft.style.outline = 'none';
          headerLeft.style.boxShadow = 'none';
          
          const headerLeftH1 = headerLeft.querySelector('h1') as HTMLElement;
          if (headerLeftH1) {
            styleTextElement(headerLeftH1, '1.2');
            headerLeftH1.style.whiteSpace = 'nowrap';
            headerLeftH1.style.overflow = 'hidden';
            headerLeftH1.style.textOverflow = 'ellipsis';
            headerLeftH1.style.fontSize = size === 'story' ? '2.5rem' : '1.5rem';
            headerLeftH1.style.color = '#ffffff'; // Ensure white text
          }
        }
        
        if (headerRight) {
          headerRight.style.display = 'flex';
          headerRight.style.flexDirection = 'column';
          headerRight.style.alignItems = 'flex-end';
          headerRight.style.justifyContent = 'center';
          headerRight.style.flex = '0 0 auto';
          headerRight.style.maxWidth = '35%';
          headerRight.style.textAlign = 'right';
          headerRight.style.border = 'none';
          headerRight.style.outline = 'none';
          headerRight.style.boxShadow = 'none';
          
          const headerRightH2 = headerRight.querySelector('h2') as HTMLElement;
          if (headerRightH2) {
            styleTextElement(headerRightH2, '1.2');
            // Fix for Macbook text wrapping issues in IG/FB story format
            if (size === 'story') {
              headerRightH2.style.whiteSpace = 'normal';
              headerRightH2.style.wordBreak = 'break-word';
              headerRightH2.style.overflowWrap = 'break-word';
              headerRightH2.style.width = '100%';
            } else {
              headerRightH2.style.whiteSpace = 'nowrap';
            }
            headerRightH2.style.overflow = 'hidden';
            headerRightH2.style.textOverflow = 'ellipsis';
            headerRightH2.style.fontSize = size === 'story' ? '2rem' : '1.25rem';
            headerRightH2.style.color = '#ffffff'; // Ensure white text
          }
          
          const headerRightP = headerRight.querySelector('p') as HTMLElement;
          if (headerRightP) {
            styleTextElement(headerRightP, '1.2');
            // Fix for Macbook text wrapping issues in IG/FB story format
            if (size === 'story') {
              headerRightP.style.whiteSpace = 'normal';
              headerRightP.style.wordBreak = 'break-word';
              headerRightP.style.overflowWrap = 'break-word';
              headerRightP.style.width = '100%';
            } else {
              headerRightP.style.whiteSpace = 'nowrap';
            }
            headerRightP.style.overflow = 'hidden';
            headerRightP.style.textOverflow = 'ellipsis';
            headerRightP.style.fontSize = size === 'story' ? '1.5rem' : '1rem';
            headerRightP.style.color = '#ffffff'; // Ensure white text
          }
        }
      }
    }
  
    // Main Content Area
    const contentArea = clone.children[1] as HTMLElement;
    if (contentArea) {
      contentArea.style.flexGrow = '1';
      contentArea.style.display = 'flex';
      contentArea.style.overflow = 'hidden';
      contentArea.style.border = 'none';
      contentArea.style.outline = 'none';
      contentArea.style.boxShadow = 'none';
      
      if (orientation === 'landscape') {
        contentArea.style.flexDirection = 'row';
        contentArea.style.alignItems = 'stretch';
      } else {
        contentArea.style.flexDirection = 'column';
        const innerContentWrapper = contentArea.children[0] as HTMLElement;
        if (innerContentWrapper) {
          innerContentWrapper.style.display = 'flex';
          innerContentWrapper.style.flexDirection = 'column';
          innerContentWrapper.style.width = '100%';
          innerContentWrapper.style.height = '100%';
          innerContentWrapper.style.border = 'none';
          innerContentWrapper.style.outline = 'none';
          innerContentWrapper.style.boxShadow = 'none';
          
          if (size === 'story') {
            innerContentWrapper.style.justifyContent = 'space-between';
            innerContentWrapper.style.alignItems = 'center';
          } else {
            innerContentWrapper.style.justifyContent = 'flex-start';
            innerContentWrapper.style.alignItems = 'center';
          }
        }
      }
    }
  
    // Dean's Lister Badge
    const deansListBadges = clone.querySelectorAll('.bg-dlsu-green.text-white:not(:first-child)') as NodeListOf<HTMLElement>;
    deansListBadges.forEach(badge => {
      badge.style.display = 'flex';
      badge.style.flexDirection = 'column';
      badge.style.justifyContent = 'center';
      badge.style.alignItems = 'center';
      badge.style.textAlign = 'center';
      badge.style.border = 'none';
      badge.style.outline = 'none';
      badge.style.boxShadow = 'none';
      badge.style.padding = size === 'story' ? '2rem' : '1rem';
      badge.style.backgroundColor = '#006f51'; // Ensure green background
      
      const badgeH3 = badge.querySelector('h3') as HTMLElement;
      if (badgeH3) {
        styleTextElement(badgeH3, '1.2');
        badgeH3.style.whiteSpace = 'normal';
        badgeH3.style.maxWidth = '90%';
        badgeH3.style.margin = '0 auto';
        badgeH3.style.display = 'block'; 
        badgeH3.style.padding = '0';
        badgeH3.style.textAlign = 'center';
        badgeH3.style.fontSize = size === 'story' ? '2.5rem' : '1.25rem';
        badgeH3.style.color = '#ffffff'; // Ensure white text
      }
      
      const badgeP = badge.querySelector('p') as HTMLElement;
      if (badgeP) {
        styleTextElement(badgeP, '1.2');
        badgeP.style.whiteSpace = 'normal';
        badgeP.style.maxWidth = '90%';
        badgeP.style.textAlign = 'center';
        badgeP.style.fontSize = size === 'story' ? '1.5rem' : '1rem';
        badgeP.style.color = '#ffffff'; // Ensure white text
      }
    });
  
    // Footer
    const footer = clone.children[2] as HTMLElement;
    if (footer) {
      footer.style.flexShrink = '0';
      footer.style.marginTop = 'auto';
      footer.style.border = 'none';
      footer.style.outline = 'none';
      footer.style.boxShadow = 'none';
    }
  
    // Table cells - ensure proper vertical alignment and text sizing
    tableRows.forEach(row => {
      const rowEl = row as HTMLElement;
      // Keep only what we need for vertical alignment
      rowEl.style.verticalAlign = 'middle';
    });
  
    tableCells.forEach(cell => {
      const cellEl = cell as HTMLElement;
      cellEl.style.verticalAlign = 'middle';
      // Keep original padding from the preview
      cellEl.style.padding = '0.75rem 1rem';
      
      // Style text within cells - keep original font sizes from preview
      const cellSpans = cellEl.querySelectorAll('span');
      cellSpans.forEach(span => {
        const spanEl = span as HTMLElement;
        styleTextElement(spanEl, '1.2');
      });
    });
  
    // Specific styling for story size - keep original styling from preview
    if (size === 'story') {
      const table = clone.querySelector('table') as HTMLElement;
      if (table) {
        table.style.fontSize = '2rem'; // Original font size from preview
        
        const tableHeaders = table.querySelectorAll('th');
        tableHeaders.forEach(header => {
          const headerEl = header as HTMLElement;
          headerEl.style.fontWeight = 'bold';
          headerEl.style.padding = '0.75rem 1rem'; // Match preview padding
        });
      }
      
      // Make GPA text smaller for IG story
      const gpaText = clone.querySelector('.font-bold.text-dlsu-green');
      if (gpaText) {
        (gpaText as HTMLElement).style.fontSize = '5.5rem'; // Reduced from the default 7rem
      }
    }
  
    // Style all headings to prevent wrapping
    const headings = clone.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach(heading => {
      const headingEl = heading as HTMLElement;
      // Don't apply nowrap to name and degree which should wrap
      if (headingEl.parentElement && headingEl.parentElement.classList.contains('text-right')) {
        headingEl.style.whiteSpace = 'normal';
        headingEl.style.overflow = 'hidden';
        headingEl.style.textOverflow = 'ellipsis';
        headingEl.style.display = '-webkit-box';
        (headingEl.style as any)['-webkit-line-clamp'] = '2';
        (headingEl.style as any)['-webkit-box-orient'] = 'vertical';
        headingEl.style.maxWidth = size === 'story' ? '500px' : '300px';
        headingEl.style.margin = '0';
        headingEl.style.padding = '0';
        headingEl.style.lineHeight = '1.3';
        headingEl.style.border = 'none';
        headingEl.style.outline = 'none';
        headingEl.style.boxShadow = 'none';
      } else if (headingEl.parentElement && headingEl.parentElement.classList.contains('bg-dlsu-green') && headingEl.tagName === 'H3') {
        // Special handling for Dean's Lister heading
        headingEl.style.whiteSpace = 'normal';
        headingEl.style.overflow = 'hidden';
        headingEl.style.textOverflow = 'ellipsis';
        headingEl.style.margin = '0 auto';
        headingEl.style.padding = '0';
        headingEl.style.maxWidth = '90%';
        headingEl.style.textAlign = 'center';
        headingEl.style.display = 'block';
        headingEl.style.lineHeight = '1.3';
        headingEl.style.border = 'none';
        headingEl.style.outline = 'none';
        headingEl.style.boxShadow = 'none';
      } else {
        headingEl.style.whiteSpace = 'nowrap';
        headingEl.style.overflow = 'visible'; // Changed to visible for Term XXX Grades
        headingEl.style.textOverflow = 'clip';
        headingEl.style.margin = '0';
        headingEl.style.padding = '0';
        headingEl.style.lineHeight = '1.2';
        headingEl.style.border = 'none';
        headingEl.style.outline = 'none';
        headingEl.style.boxShadow = 'none';
      }
    });
  
    // Style all paragraphs
    const paragraphs = clone.querySelectorAll('p');
    paragraphs.forEach(paragraph => {
      const paragraphEl = paragraph as HTMLElement;
      // Special handling for degree paragraph in the header
      if (paragraphEl.parentElement && paragraphEl.parentElement.classList.contains('text-right')) {
        paragraphEl.style.whiteSpace = 'normal';
        paragraphEl.style.overflow = 'hidden';
        paragraphEl.style.textOverflow = 'ellipsis';
        paragraphEl.style.display = '-webkit-box';
        (paragraphEl.style as any)['-webkit-line-clamp'] = '2';
        (paragraphEl.style as any)['-webkit-box-orient'] = 'vertical';
        paragraphEl.style.maxWidth = size === 'story' ? '500px' : '300px';
        paragraphEl.style.margin = '0';
        paragraphEl.style.padding = '0';
        paragraphEl.style.lineHeight = '1.3';
      } else {
        paragraphEl.style.margin = '0';
        paragraphEl.style.padding = '0';
        paragraphEl.style.lineHeight = '1.2';
      }
      paragraphEl.style.border = 'none';
      paragraphEl.style.outline = 'none';
      paragraphEl.style.boxShadow = 'none';
    });
    
    // Fix header layout
    const header = clone.querySelector('.bg-dlsu-green') as HTMLElement;
    if (header) {
      const headerContent = header.querySelector('.flex') as HTMLElement;
      if (headerContent) {
        headerContent.style.justifyContent = 'space-between';
        headerContent.style.alignItems = 'center';
        headerContent.style.height = '100%';
        
        // Fix left side (Term XX Grades)
        const leftDiv = headerContent.children[0] as HTMLElement;
        if (leftDiv) {
          leftDiv.style.width = '40%';
          leftDiv.style.flexShrink = '0';
        }
        
        // Fix right side (Name and Degree)
        const rightDiv = headerContent.children[1] as HTMLElement;
        if (rightDiv) {
          rightDiv.style.width = '60%';
          rightDiv.style.maxWidth = '60%';
          
          // Ensure right alignment
          const nameElement = rightDiv.querySelector('h2') as HTMLElement;
          if (nameElement) {
            nameElement.style.marginLeft = 'auto';
          }
          
          const degreeElement = rightDiv.querySelector('p') as HTMLElement;
          if (degreeElement) {
            degreeElement.style.marginLeft = 'auto';
          }
        }
      }
    }
  
    // Append clone to temporary container
    tempContainer.appendChild(clone);
  
    const options = {
      width: targetWidth,
      height: targetHeight,
      quality: 1.0,
      style: {
        margin: '0',
        transform: 'scale(1)',
        transformOrigin: 'top left',
        border: 'none',
        outline: 'none',
        boxShadow: 'none',
      },
    };
  
    domtoimage.toPng(tempContainer, options)
      .then((dataUrl: string) => {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `Greendex_Term${term}_Grades.png`;
        link.click();
      })
      .catch((error: any) => {
        console.error('dom-to-image error:', error);
        alert('An error occurred while generating the image. Please try again.');
      })
      .finally(() => {
        if (tempContainer && tempContainer.parentElement === document.body) {
          document.body.removeChild(tempContainer);
        }
      });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 print:hidden">
      <div className="bg-white rounded-lg p-4 sm:p-6 max-w-5xl w-full mx-2 sm:mx-4 max-h-[90vh] overflow-auto print-modal-content">
        {/* ... (Modal JSX as before - no changes needed here) ... */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-dlsu-green">Print Grades</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {step === 'info' ? (
          <form onSubmit={handleSubmitInfo} className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-4">
                Add your personal details below. This information will not be saved and will only be used for the printed document.
              </p>
              <div className="space-y-3">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name (Optional)
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded"
                    placeholder="e.g., Juan Dela Cruz"
                  />
                </div>
                <div>
                  <label htmlFor="degree" className="block text-sm font-medium text-gray-700 mb-1">
                    Degree Program (Optional)
                  </label>
                  <input
                    type="text"
                    id="degree"
                    value={degree}
                    onChange={(e) => setDegree(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded"
                    placeholder="e.g., BS Computer Science"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-md font-medium text-gray-700 mb-2">Document Options</h3>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="sm:w-1/2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Size</label>
                  <div className="space-y-2">
                    <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        name="size"
                        value="standard"
                        checked={size === 'standard'}
                        onChange={() => handleSizeChange('standard')}
                        className="mr-3 h-4 w-4 accent-dlsu-green"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm">Standard (Letter/A4)</div>
                        <div className="text-xs text-gray-500 whitespace-normal">Best for physical printing</div>
                      </div>
                    </label>
                    <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        name="size"
                        value="story"
                        checked={size === 'story'}
                        onChange={() => handleSizeChange('story')}
                        className="mr-3 h-4 w-4 accent-dlsu-green"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm">IG/FB Story</div>
                        <div className="text-xs text-gray-500 whitespace-normal">Perfect for sharing on social media</div>
                      </div>
                    </label>
                  </div>
                </div>
                <div className="sm:w-1/2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Orientation</label>
                  <div className="space-y-2">
                    <label className={`flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${size === 'story' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <input
                        type="radio"
                        name="orientation"
                        value="portrait"
                        checked={orientation === 'portrait'}
                        onChange={() => handleOrientationChange('portrait')}
                        className="mr-3 h-4 w-4 accent-dlsu-green"
                        disabled={size === 'story'}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm">Portrait</div>
                        <div className="text-xs text-gray-500 whitespace-normal">Vertical (8.5" x 11")</div>
                      </div>
                    </label>
                    <label className={`flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${size === 'story' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <input
                        type="radio"
                        name="orientation"
                        value="landscape"
                        checked={orientation === 'landscape'}
                        onChange={() => handleOrientationChange('landscape')}
                        className="mr-3 h-4 w-4 accent-dlsu-green"
                        disabled={size === 'story'}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm">Landscape</div>
                        <div className="text-xs text-gray-500 whitespace-normal">Horizontal (11" x 8.5")</div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-dlsu-green text-white rounded hover:bg-dlsu-green/90 transition-colors"
              >
                Continue to Preview
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-md font-medium text-gray-700">Preview</h3>
              <button
                onClick={handleBack}
                className="text-sm text-dlsu-green hover:text-dlsu-light-green flex items-center"
              >
                <span className="mr-1">Edit details</span>
              </button>
            </div>
            <div className="overflow-auto max-h-[60vh] flex justify-center items-start p-2 sm:p-4 bg-gray-100 rounded print-preview-container" ref={previewContainerRef}>
              <div style={{ transform: size === 'story' ? 'scale(0.3)' : 'scale(0.5)', transformOrigin: 'top center' }}>
                <PrintPreview
                  courses={courses}
                  term={term}
                  gpa={gpa}
                  totalUnits={totalUnits}
                  totalNASUnits={totalNASUnits}
                  isDeansLister={isDeansLister}
                  isFirstHonors={isFirstHonors}
                  isFlowchartExempt={isFlowchartExempt}
                  name={name}
                  degree={degree}
                  size={size}
                  orientation={orientation}
                />
              </div>
            </div>
            <div className="pt-4 flex flex-col sm:flex-row justify-between gap-3">
              <button
                onClick={handleBack}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-dlsu-green text-white rounded hover:bg-dlsu-green/90 transition-colors flex items-center justify-center"
                >
                  <PrinterIcon size={18} className="mr-1" />
                  Print
                </button>
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <Download size={18} className="mr-1" />
                  Download as Image
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