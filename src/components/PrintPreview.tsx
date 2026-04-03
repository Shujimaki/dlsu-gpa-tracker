import type { Course } from '../types';
import { getPrintHTML } from './PrintHTMLBuilder';

interface PrintPreviewProps {
  courses: Course[];
  term: number;
  gpa: number;
  totalUnits: number;
  totalNASUnits: number;
  isDeansLister: boolean;
  isFirstHonors: boolean;
  name: string;
  degree: string;
  size: 'standard' | 'story';
  orientation: 'portrait' | 'landscape';
}

const DIMS = { story: { w: 1080, h: 1920 }, portrait: { w: 816, h: 1056 }, landscape: { w: 1056, h: 816 } } as const;

// ── React Component ──
const PrintPreview = ({
  courses, term, gpa, totalUnits, totalNASUnits,
  isDeansLister, isFirstHonors,
  name, degree, size, orientation
}: PrintPreviewProps) => {
  const layout: 'story' | 'portrait' | 'landscape' =
    size === 'story' ? 'story' : orientation;
  const dim = DIMS[layout];

  return (
    <div
      id="print-preview"
      style={{
        width: dim.w,
        height: dim.h,
        overflow: 'hidden',
        flexShrink: 0,
        fontFamily: "'DM Sans', 'Archivo', sans-serif",
        background: '#FFFFFF',
      }}
      dangerouslySetInnerHTML={{
        __html: getPrintHTML(
          courses, term, gpa, totalUnits, totalNASUnits,
          isDeansLister, isFirstHonors, name, degree, layout
        ),
      }}
    />
  );
};

export default PrintPreview;
