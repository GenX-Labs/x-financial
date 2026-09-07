'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2, Brain, Search, BarChart2 } from 'lucide-react';
import { uploadFile } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import { toast } from 'react-hot-toast';
import { QualityAssessment } from '@/types';

const FILE_TYPES = {
  'application/pdf': '.pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'application/vnd.ms-excel': '.xls',
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function UploadPage() {
  const router = useRouter();
  const { addDataset, setCurrentDataset, setLoading } = useAppStore();
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [stage, setStage] = useState<'idle' | 'uploading' | 'scanning' | 'validating' | 'extracting' | 'analyzing' | 'complete' | 'error'>('idle');
  const [quality, setQuality] = useState<QualityAssessment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showQualityModal, setShowQualityModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stages = [
    { key: 'scanning', label: 'Privacy Scan', icon: Search },
    { key: 'validating', label: 'Quality Check', icon: CheckCircle },
    { key: 'extracting', label: 'Data Extraction', icon: FileText },
    { key: 'analyzing', label: 'AI Analysis', icon: Brain },
  ];

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const acceptedFile = acceptedFiles[0];
    if (acceptedFile.size > MAX_FILE_SIZE) {
      toast.error('File size must be less than 10MB');
      return;
    }
    setFile(acceptedFile);
    setError(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    noClick: false,
  });

  const handleUpload = async () => {
    if (!file) return;
    
    setStage('uploading');
    setUploadProgress(0);
    setLoading(true);
    setError(null);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await uploadFile(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Go through stages
      for (const s of stages) {
        setStage(s.key as any);
        await new Promise(r => setTimeout(r, 800));
      }

      setStage('complete');
      
      const dataset = {
        id: result.datasetId,
        userId: 'current-user',
        fileName: file.name,
        fileType: file.name.endsWith('.pdf') ? 'pdf' as const : 'xlsx' as const,
        uploadedAt: new Date().toISOString(),
        data: result.data,
        qualityScore: result.quality.score,
        qualityLevel: result.quality.level,
        qualityIssues: result.quality.issues,
        analysis: result.analysis,
      };

      addDataset(dataset);
      setCurrentDataset(dataset);
      
      setQuality(result.quality);
      
      if (result.quality.score < 80) {
        setShowQualityModal(true);
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setStage('error');
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
      toast.error('Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueAnyway = () => {
    setShowQualityModal(false);
    router.push('/dashboard');
  };

  const handleRemoveFile = () => {
    setFile(null);
    setStage('idle');
    setUploadProgress(0);
    setQuality(null);
    setError(null);
  };

  const getStageColor = (stageKey: string) => {
    const currentIndex = stages.findIndex(s => s.key === stage);
    const stageIndex = stages.findIndex(s => s.key === stageKey);
    
    if (stage === 'complete' || stage === 'error') return 'text-green-600';
    if (stageIndex < currentIndex) return 'text-green-600';
    if (stageIndex === currentIndex) return 'text-primary-600';
    return 'text-gray-400';
  };

  const getStageBg = (stageKey: string) => {
    const currentIndex = stages.findIndex(s => s.key === stage);
    const stageIndex = stages.findIndex(s => s.key === stageKey);
    
    if (stage === 'complete' || stage === 'error') return 'bg-green-100 border-green-300';
    if (stageIndex < currentIndex) return 'bg-green-100 border-green-300';
    if (stageIndex === currentIndex) return 'bg-primary-100 border-primary-300';
    return 'bg-gray-100 border-gray-200';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Upload Financial Data</h1>
          <p className="text-gray-600 mt-2">Drag & drop a PDF or Excel file to begin AI-powered analysis</p>
        </motion.div>

        {/* Drop Zone / File Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          {!file ? (
            <div
              {...getRootProps()}
              className={`
                relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300
                ${isDragActive 
                  ? 'border-primary-500 bg-primary-50' 
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <input {...getInputProps()} />
              <Upload className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">Drop your file here or click to browse</p>
              <p className="text-gray-500 mb-4">PDF, XLSX, XLS up to 10MB</p>
              <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full">.pdf</span>
                <span className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full">.xlsx</span>
                <span className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full">.xls</span>
              </div>
            </div>
          ) : (
            <Card className="border-2 border-primary-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-primary-100 flex items-center justify-center">
                      <FileText className="w-7 h-7 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleRemoveFile}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Progress Stages */}
        {stage !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Processing Pipeline</h3>
              {stage !== 'complete' && stage !== 'error' && (
                <div className="flex items-center gap-2 text-sm text-primary-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{uploadProgress}%</span>
                </div>
              )}
            </div>
            
            <div className="relative">
              <div className="absolute top-3 left-0 right-0 h-1 bg-gray-200" />
              <div className="relative flex items-center justify-between">
                {stages.map((s, index) => (
                  <motion.div
                    key={s.key}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative z-10 flex flex-col items-center"
                  >
                    <div
                      className={`
                        w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                        ${getStageBg(s.key)}
                      `}
                    >
                      <s.icon className={cn('w-5 h-5', getStageColor(s.key))} />
                    </div>
                    <span className={cn('mt-2 text-xs font-medium text-center w-24', getStageColor(s.key))}>
                      {s.label}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>

            {stage === 'error' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800">Error</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Upload Button */}
        {file && stage === 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Button onClick={handleUpload} className="w-full lg:w-auto" size="lg" loading={stage === 'uploading'}>
              <Upload className="w-5 h-5" />
              Start Analysis
            </Button>
          </motion.div>
        )}

        {/* Success State */}
        {stage === 'complete' && quality && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-8"
          >
            <Card className="border-2 border-green-200 bg-green-50">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-green-800">Analysis Complete!</h3>
                    <p className="text-green-700 mt-1">Your financial data has been processed and analyzed.</p>
                    
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Badge variant="success" size="lg" dot>
                        Quality Score: {quality.score}/100
                      </Badge>
                      <Badge 
                        variant={
                          quality.level === 'excellent' ? 'success' :
                          quality.level === 'good' ? 'info' :
                          quality.level === 'warning' ? 'warning' : 'danger'
                        } 
                        size="lg"
                      >
                        {quality.level.charAt(0).toUpperCase() + quality.level.slice(1)}
                      </Badge>
                    </div>

                    {quality.issues.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-green-800 mb-2">Issues Found:</p>
                        <ul className="text-sm text-green-700 space-y-1">
                          {quality.issues.map((issue, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                              {issue}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-6 flex gap-3">
                  <Button onClick={() => router.push('/dashboard')} className="flex-1">
                    <BarChart2 className="w-4 h-4" />
                    View Dashboard
                  </Button>
                  <Button variant="outline" onClick={handleRemoveFile}>
                    Upload Another
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Info Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 grid md:grid-cols-3 gap-6"
        >
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <Search className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Privacy First</h3>
              <p className="text-sm text-gray-600">Automatic PII detection and removal before processing</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Quality Scoring</h3>
              <p className="text-sm text-gray-600">100-point data quality assessment with detailed issues</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mx-auto mb-4">
                <Brain className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">AI Analysis</h3>
              <p className="text-sm text-gray-600">Pattern detection, risk scoring, and actionable insights</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quality Warning Modal */}
      <AnimatePresence>
        {showQualityModal && quality && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowQualityModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl max-w-md w-full p-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center',
                  quality.score >= 60 ? 'bg-yellow-100' : 'bg-red-100'
                )}>
                  <AlertCircle className={cn('w-6 h-6', quality.score >= 60 ? 'text-yellow-600' : 'text-red-600')} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Data Quality Warning</h3>
                  <p className="text-sm text-gray-500">Score: {quality.score}/100</p>
                </div>
              </div>

              <p className="text-gray-600 mb-4">
                We found data quality issues that may affect analysis accuracy. 
                You can continue anyway, but results may be limited.
              </p>

              <div className="space-y-2 mb-6 max-h-40 overflow-y-auto">
                {quality.issues.map((issue, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{issue}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1" 
                  onClick={handleRemoveFile}
                >
                  Upload Different File
                </Button>
                <Button 
                  className="flex-1" 
                  onClick={handleContinueAnyway}
                >
                  Continue Anyway
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}