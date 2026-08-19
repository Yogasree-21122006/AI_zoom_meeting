import React, { useState, useRef } from 'react';
import { useMeetingStore } from '../store/useMeetingStore';
import { 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Minimize2, 
  X, 
  Upload, 
  FileText, 
  Download, 
  Radio, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Sparkles,
  Presentation
} from 'lucide-react';
import type { SharedDocument } from '../types';
import { detectPdfPageCount } from '../utils/pdfUtils';

// Preset sample lecture slides in case faculty wants to test immediately
const SAMPLE_PRESENTATIONS: Omit<SharedDocument, 'id' | 'uploadedBy' | 'uploadedRole'>[] = [
  {
    fileName: 'AI & Machine Learning in Education.pdf',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    fileType: 'application/pdf',
    totalPages: 1,
    currentPage: 1,
  },
  {
    fileName: 'Data Structures & Algorithms - Lecture 4.pdf',
    fileUrl: 'https://pdfobject.com/pdf/sample.pdf',
    fileType: 'application/pdf',
    totalPages: 1,
    currentPage: 1,
  }
];

export const PresentationUploadModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { shareDocument, userName, userRole, addToast } = useMeetingStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      // Calculate exact number of pages dynamically
      const detectedPages = await detectPdfPageCount(file);
      const fileUrl = URL.createObjectURL(file);
      
      const newDoc: SharedDocument = {
        id: `doc-${Date.now()}`,
        fileName: file.name,
        fileUrl: fileUrl,
        fileType: file.type || 'application/pdf',
        totalPages: detectedPages || 1,
        currentPage: 1,
        uploadedBy: userName,
        uploadedRole: userRole,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      shareDocument(newDoc);
      addToast(`Shared presentation "${file.name}" (${detectedPages} ${detectedPages === 1 ? 'page' : 'pages'}) with all students!`, 'info');
      onClose();
    } catch (err: any) {
      console.error('File upload error:', err);
      addToast(`Failed to upload presentation: ${err.message}`, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectSample = (sample: typeof SAMPLE_PRESENTATIONS[0]) => {
    const newDoc: SharedDocument = {
      ...sample,
      id: `doc-${Date.now()}`,
      uploadedBy: userName,
      uploadedRole: userRole,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    shareDocument(newDoc);
    addToast(`Shared "${sample.fileName}" with classroom!`, 'info');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl border border-purple-200 shadow-2xl max-w-lg w-full p-6 space-y-5 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-200">
            <Presentation className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-850">Share PPT / PDF Presentation</h3>
            <p className="text-xs text-slate-500">Students view slides directly in crystal-clear vector quality</p>
          </div>
        </div>

        {/* Drag & Drop or Browse Box */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-purple-200 hover:border-blue-500 bg-purple-50/40 hover:bg-blue-50/30 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 group"
        >
          <div className="p-4 rounded-full bg-white shadow-md text-blue-600 group-hover:scale-110 transition-transform">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-700 block">
              {isUploading ? 'Analyzing & Counting Pages...' : 'Click to Upload PPT or PDF File'}
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Supports .pdf, .ppt, .pptx, images (Auto detects exact page count)
            </span>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept=".pdf,.ppt,.pptx,image/*" 
            className="hidden" 
          />
        </div>

        {/* Sample Presentation quick loaders */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Or Choose a Sample Lecture Deck</span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {SAMPLE_PRESENTATIONS.map((sample, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectSample(sample)}
                className="flex items-center justify-between p-3 rounded-xl border border-purple-100 hover:border-blue-400 bg-white hover:bg-blue-50/40 text-left transition-all group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span className="text-xs font-semibold text-slate-750 truncate group-hover:text-blue-700">
                    {sample.fileName}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 px-2 py-0.5 rounded-full bg-slate-100 flex-shrink-0">
                  {sample.totalPages} {sample.totalPages === 1 ? 'Page' : 'Pages'}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="text-[10px] text-slate-400 text-center">
          💡 Slide changes made by the teacher will automatically synchronize with students.
        </div>
      </div>
    </div>
  );
};

export const PresentationViewer: React.FC = () => {
  const { 
    sharedDocument, 
    isPresentationViewerOpen, 
    togglePresentationViewer,
    userRole,
    setDocumentCurrentPage,
    isFollowingTeacher,
    toggleFollowTeacher,
    presentationViewMode,
    setPresentationViewMode
  } = useMeetingStore();

  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);

  if (!isPresentationViewerOpen || !sharedDocument) {
    return (
      <PresentationUploadModal 
        isOpen={showUploadModal} 
        onClose={() => setShowUploadModal(false)} 
      />
    );
  }

  const isTeacher = userRole === 'teacher';
  const totalPages = Math.max(1, sharedDocument.totalPages || 1);
  const currentPage = Math.min(Math.max(1, sharedDocument.currentPage || 1), totalPages);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setDocumentCurrentPage(currentPage - 1, isTeacher);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setDocumentCurrentPage(currentPage + 1, isTeacher);
    }
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 25, 75));
  const handleResetZoom = () => setZoomLevel(100);

  return (
    <>
      <PresentationUploadModal 
        isOpen={showUploadModal} 
        onClose={() => setShowUploadModal(false)} 
      />

      <div className={`
        ${presentationViewMode === 'fullscreen' 
          ? 'fixed inset-0 z-50 bg-slate-900/95 p-4 flex flex-col' 
          : 'w-full lg:w-[50%] h-[480px] lg:h-full bg-white rounded-2xl border border-purple-200 shadow-xl flex flex-col overflow-hidden relative'
        }
      `}>
        {/* Presentation Header Bar */}
        <div className="p-3 bg-purple-50/70 border-b border-purple-100 flex items-center justify-between gap-2 flex-wrap">
          {/* Left info */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 bg-blue-600 text-white rounded-lg">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-slate-800 truncate" title={sharedDocument.fileName}>
                {sharedDocument.fileName}
              </h4>
              <p className="text-[10px] text-slate-500">
                Shared by <span className="font-semibold text-blue-600">{sharedDocument.uploadedBy}</span>
              </p>
            </div>
          </div>

          {/* Sync / Follow Status Indicator */}
          <div className="flex items-center gap-2">
            {isTeacher ? (
              <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold rounded-full flex items-center gap-1 shadow-sm">
                <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
                <span>Live Sync Active</span>
              </span>
            ) : (
              <button
                onClick={toggleFollowTeacher}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-full border transition-all flex items-center gap-1 ${
                  isFollowingTeacher 
                    ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-sm' 
                    : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                }`}
                title="When enabled, your slide snaps automatically when the teacher flips pages"
              >
                <Radio className={`w-3 h-3 ${isFollowingTeacher ? 'text-blue-600 animate-pulse' : 'text-slate-400'}`} />
                <span>{isFollowingTeacher ? 'Following Teacher' : 'Free Scroll Mode'}</span>
              </button>
            )}

            {/* Replace / Upload New button for teacher */}
            {isTeacher && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-2.5 py-1 bg-white hover:bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold rounded-lg transition-colors flex items-center gap-1 shadow-sm"
              >
                <Upload className="w-3 h-3" />
                <span>Change Slide</span>
              </button>
            )}

            {/* View Mode & Close toggles */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPresentationViewMode(presentationViewMode === 'fullscreen' ? 'split' : 'fullscreen')}
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors"
                title={presentationViewMode === 'fullscreen' ? "Exit Fullscreen" : "Fullscreen Presentation"}
              >
                {presentationViewMode === 'fullscreen' ? <Minimize2 className="w-4 h-4 text-white" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <button
                onClick={() => togglePresentationViewer(false)}
                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Close Presentation View"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Slide Document Body Display */}
        <div className="flex-grow bg-slate-900 relative overflow-hidden flex items-center justify-center p-2 sm:p-4">
          <div 
            style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center center', transition: 'transform 0.2s ease' }}
            className="w-full h-full max-h-full rounded-xl overflow-hidden bg-white shadow-2xl flex flex-col relative"
          >
            {sharedDocument.fileUrl.endsWith('.pdf') || sharedDocument.fileType.includes('pdf') ? (
              <iframe 
                src={`${sharedDocument.fileUrl}#page=${currentPage}&toolbar=0&navpanes=0&scrollbar=1`}
                title="Presentation PDF Viewer"
                className="w-full h-full border-0 min-h-[300px]"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-4 bg-gradient-to-br from-slate-900 to-indigo-950 text-white">
                <div className="p-4 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20">
                  <Presentation className="w-12 h-12 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">{sharedDocument.fileName}</h3>
                  <p className="text-xs text-slate-300 mt-1">Slide Page {currentPage} of {totalPages}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 max-w-sm text-xs text-slate-300 leading-relaxed font-sans">
                  👨‍🏫 Teacher is reviewing key concepts on Slide #{currentPage}. Follow along with live notes and microphone discussion.
                </div>
              </div>
            )}

            {/* Slide Page Floating Badge */}
            <div className="absolute top-3 right-3 px-2.5 py-1 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-mono font-bold rounded-lg border border-white/20 shadow-md">
              Slide {currentPage} / {totalPages}
            </div>
          </div>
        </div>

        {/* Navigation & Controls Footer */}
        <div className="p-3 bg-white border-t border-purple-100 flex items-center justify-between gap-3 flex-wrap">
          {/* Zoom controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono font-bold text-slate-600 w-10 text-center">
              {zoomLevel}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Slide navigation buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevPage}
              disabled={currentPage <= 1 || totalPages <= 1}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 text-xs font-bold transition-all flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Prev</span>
            </button>

            <span className="text-xs font-bold text-slate-700 px-2">
              {currentPage} / {totalPages}
            </span>

            <button
              onClick={handleNextPage}
              disabled={currentPage >= totalPages || totalPages <= 1}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Download presentation link */}
          <a
            href={sharedDocument.fileUrl}
            download={sharedDocument.fileName}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 border border-slate-200"
            title="Download PDF to device"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Save PDF</span>
          </a>
        </div>
      </div>
    </>
  );
};

export default PresentationViewer;
