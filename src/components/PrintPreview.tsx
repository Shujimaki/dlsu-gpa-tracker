import { useRef } from 'react';
import type { Course } from '../types';
import './PrintStyles.css';

interface PrintPreviewProps {
  courses: Course[];
  term: number;
  gpa: number;
  totalUnits: number;
  totalNASUnits: number;
  isDeansLister: boolean;
  isFirstHonors: boolean;
  isFlowchartExempt: boolean;
  name: string;
  degree: string;
  size: 'standard' | 'story';
  orientation: 'portrait' | 'landscape';
}

const PrintPreview = ({
  courses,
  term,
  gpa,
  totalUnits,
  totalNASUnits,
  isDeansLister,
  isFirstHonors,
  isFlowchartExempt,
  name,
  degree,
  size,
  orientation
}: PrintPreviewProps) => {
  const previewRef = useRef<HTMLDivElement>(null);

  const getSizeClass = () => {
    if (size === 'story') return 'print-story';
    return orientation === 'portrait' ? 'print-standard-portrait' : 'print-standard-landscape';
  };

  const getContentStyles = () => {
    if (size === 'story') {
      return {
        header: { padding: '2.5rem' },
        content: {
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column' as const,
          justifyContent: 'space-between', // To push footer down if content is short
          alignItems: 'center',
          flex: '1 1 auto'
        },
        gpaText: { fontSize: '7rem', lineHeight: '1' },
        table: { fontSize: '2rem' },
        deansListerText: { fontSize: '3rem', margin: 0 }, // Added margin: 0
        totalUnitsText: { fontSize: '2rem' },
        footer: { padding: '2rem' }
      };
    }

    if (orientation === 'landscape') {
      return {
        header: { padding: '1rem 1.5rem' },
        content: {
          padding: '1rem 1.5rem',
          display: 'flex',
          flexDirection: 'row' as const,
          justifyContent: 'space-between',
          alignItems: 'stretch', // Changed to stretch for equal height columns
          flex: '1 1 auto'
        },
        tableContainer: { width: '60%', paddingRight: '1.5rem' },
        summaryContainer: { // This is a flex item now, will be centered by its parent (content)
          width: '40%',
          display: 'flex', // Crucial for its children
          flexDirection: 'column' as const, // Crucial
          justifyContent: 'center', // Vertically center children
          alignItems: 'center', // Horizontally center children
          // height: '100%' // Not needed if parent alignItems: 'stretch'
        },
        gpaText: { fontSize: '3rem' },
        table: { fontSize: '0.9rem' },
        deansListerText: { fontSize: '1.25rem', margin: 0 }, // Added margin: 0
        totalUnitsText: { fontSize: '1rem' },
        footer: { padding: '0.75rem' }
      };
    }

    // Default portrait styles
    return {
      header: { padding: '1.5rem' },
      content: {
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column' as const,
        justifyContent: 'flex-start', // Content starts at top
        alignItems: 'center', // Center content blocks horizontally
        flex: '1 1 auto'
      },
      gpaText: { fontSize: '3rem' },
      table: { fontSize: '1rem' },
      deansListerText: { fontSize: '1.5rem', margin: 0 }, // Added margin: 0
      totalUnitsText: { fontSize: '1rem' },
      footer: { padding: '1rem' }
    };
  };

  const styles = getContentStyles();

  return (
    <div
      id="print-preview"
      ref={previewRef}
      className={`${getSizeClass()} border border-gray-300 shadow-lg mx-auto flex flex-col bg-white`} // Added bg-white here
      style={{
        width: size === 'story' ? '1080px' : orientation === 'portrait' ? '8.5in' : '11in',
        height: size === 'story' ? '1920px' : orientation === 'portrait' ? '11in' : '8.5in',
        overflow: 'hidden',
        position: 'relative' // Keep for potential absolute children
      }}
    >
      {/* DLSU-themed header */}
      <div className="bg-dlsu-green text-white w-full" style={{ ...styles.header, flex: '0 0 auto' }}>
        <div className="flex justify-between items-center">
          <div>
            <h1 className={`${size === 'story' ? 'text-5xl' : 'text-2xl'} font-bold`}>Term {term} Grades</h1>
          </div>
          {(name || degree) && (
            <div className="text-right">
              <h2 className={`${size === 'story' ? 'text-3xl' : 'text-lg'} font-medium`}>{name}</h2>
              {degree && <p className={`${size === 'story' ? 'text-xl' : 'text-sm'} opacity-80`}>{degree}</p>}
            </div>
          )}
        </div>
      </div>

      {/* Course list and Summary Area */}
      <div className="bg-white w-full" style={{ ...styles.content }}>
        {orientation === 'landscape' ? (
          <>
            <div style={{ ...styles.tableContainer }}>
              {/* Table remains the same */}
              <table className="w-full border-collapse" style={{ ...styles.table }}>
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="text-left py-2 px-3 text-dlsu-green">Course Code</th>
                    <th className="text-center py-2 px-3 text-dlsu-green">Units</th>
                    <th className="text-center py-2 px-3 text-dlsu-green">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map(course => (
                    <tr key={course.id} className="border-b border-gray-200">
                      <td className="py-2 px-3 font-medium">{course.code || '-'}</td>
                      <td className="py-2 px-3 text-center">
                        {course.nas ? `(${course.units})` : course.units}
                      </td>
                      <td className="py-2 px-3 text-center font-medium">
                        {course.nas && course.units === 0
                          ? (course.grade === 1 ? 'P' : 'F')
                          : course.grade.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Summary Container - now a flex item, its children will be centered by its own flex properties */}
            <div style={{ ...styles.summaryContainer }} className="summary-container-landscape"> {/* Added a class for easier selection in html2canvas fixes if needed */}
              <div className="flex flex-col items-center w-full"> {/* This div is for grouping within summary, already centered by parent */}
                <div className="text-center mb-4">
                  <div className="font-bold text-dlsu-green" style={{ ...styles.gpaText }}>
                    {typeof gpa === 'number' ? gpa.toFixed(3) : gpa}
                  </div>
                  <div style={{ ...styles.totalUnitsText }} className="text-gray-600 mt-2">
                    Total Units: {totalUnits}
                    {totalNASUnits > 0 && (
                      <span className="ml-1">({totalNASUnits} NAS)</span>
                    )}
                  </div>
                </div>
                {isDeansLister && (
                  <div
                    className="w-full rounded-lg p-4 text-center bg-dlsu-green text-white flex flex-col justify-center items-center" // Tailwind flex centering
                    style={{ minHeight: '60px' }}
                  >
                    <h3 className="font-bold" style={{ ...styles.deansListerText }}> {/* margin: 0 already in styles object */}
                      {isFirstHonors ? "First Honors Dean's Lister" : "Second Honors Dean's Lister"}
                    </h3>
                    {isFlowchartExempt && (
                      <p className="text-sm opacity-90 mt-1">* Flowchart exemption from 12-unit requirement applied</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          // Portrait and Story layout
          // The outer div of content area already has: display: flex, flexDirection: column, alignItems: center
          // So, children will be stacked and centered horizontally.
          // For story mode with justify-content: space-between, we need to ensure elements behave correctly.
          <div className={`max-w-4xl mx-auto w-full ${size === 'story' ? 'h-full flex flex-col justify-between items-center' : 'flex flex-col items-center'}`}>
            {/* Table for Portrait/Story */}
            <table className={`w-full border-collapse ${size === 'story' ? 'mb-8' : 'mb-4'}`} style={{ ...styles.table }}>
              {/* Table content as before */}
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className={`text-left text-dlsu-green ${size === 'story' ? 'py-4 px-6' : 'py-2 px-4'}`}>Course Code</th>
                  <th className={`text-center text-dlsu-green ${size === 'story' ? 'py-4 px-6' : 'py-2 px-4'}`}>Units</th>
                  <th className={`text-center text-dlsu-green ${size === 'story' ? 'py-4 px-6' : 'py-2 px-4'}`}>Grade</th>
                </tr>
              </thead>
              <tbody>
                {courses.map(course => (
                  <tr key={course.id} className="border-b border-gray-200">
                    <td className={`font-medium ${size === 'story' ? 'py-4 px-6' : 'py-2 px-4'}`}>{course.code || '-'}</td>
                    <td className={`text-center ${size === 'story' ? 'py-4 px-6' : 'py-2 px-4'}`}>
                      {course.nas ? `(${course.units})` : course.units}
                    </td>
                    <td className={`text-center font-medium ${size === 'story' ? 'py-4 px-6' : 'py-2 px-4'}`}>
                      {course.nas && course.units === 0
                        ? (course.grade === 1 ? 'P' : 'F')
                        : course.grade.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* GPA and Dean's Lister section for Portrait/Story */}
            <div className={`flex flex-col items-center ${size === 'story' ? 'my-auto' : 'mt-4 mb-4'}`}> {/* my-auto for story to help with space-between */}
              <div className={`text-center ${size === 'story' ? 'mb-8' : 'mb-4'}`}>
                <div className="font-bold text-dlsu-green" style={{ ...styles.gpaText }}>
                  {typeof gpa === 'number' ? gpa.toFixed(3) : gpa}
                </div>
                <div style={{ ...styles.totalUnitsText }} className="text-gray-600 mt-2">
                  Total Units: {totalUnits}
                  {totalNASUnits > 0 && (
                    <span className="ml-1">({totalNASUnits} NAS)</span>
                  )}
                </div>
              </div>
              {isDeansLister && (
                <div
                  className={`w-full max-w-md mx-auto rounded-lg ${size === 'story' ? 'p-8' : 'p-4'} text-center bg-dlsu-green text-white flex flex-col justify-center items-center`} // Tailwind flex centering
                  style={{ minHeight: size === 'story' ? '120px' : '80px' }}
                >
                  <h3 className="font-bold" style={{ ...styles.deansListerText }}> {/* margin: 0 already in styles object */}
                    {isFirstHonors ? "First Honors Dean's Lister" : "Second Honors Dean's Lister"}
                  </h3>
                  {isFlowchartExempt && (
                    <p className={`${size === 'story' ? 'text-lg' : 'text-sm'} opacity-90 mt-1`}>
                      * Flowchart exemption from 12-unit requirement applied
                    </p>
                  )}
                </div>
              )}
            </div>
             {/* Spacer for story mode if needed, or rely on justify-between and my-auto */}
             {size === 'story' && <div style={{ flexGrow: 1 }}></div>}
          </div>
        )}
      </div>

      {/* Footer - Full width */}
      <div className="bg-gray-100 text-center text-xs text-gray-500 w-full" style={{ ...styles.footer, marginTop: 'auto' }}> {/* Ensure footer is pushed down */}
        <p className={size === 'story' ? 'text-base' : ''}>Generated using <span className="font-medium">Greendex DLSU GPA Calculator</span></p>
        <p className={size === 'story' ? 'text-sm mt-2' : 'text-[10px] mt-1'}>
          Greendex is not officially affiliated with De La Salle University
        </p>
      </div>
    </div>
  );
};

export default PrintPreview;
