'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/components/AuthProvider';
import { Layout } from '@/components/Layout';
import { useAppStore } from '@/store/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { deleteDataset } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { Link } from 'next/link';
import {
  Upload,
  BarChart2,
  Trash2,
  FileText,
  Eye,
  Clock,
  CheckCircle,
  AlertTriangle,
  X,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Download,
} from 'lucide-react';
import { UploadedDataset } from '@/types';

export default function HistoryPage() {
  const { user } = useAuth();
  const { datasets, removeDataset, setCurrentDataset } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'pdf' | 'xlsx'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const filteredDatasets = datasets
    .filter(d => {
      const matchesSearch = d.fileName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'all' || d.fileType === filterType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteDataset(id);
      removeDataset(id);
      toast.success('Dataset deleted');
    } catch (error) {
      toast.error('Failed to delete dataset');
    } finally {
      setDeletingId(null);
      setShowDeleteConfirm(null);
    }
  };

  const getQualityBadge = (score: number) => {
    if (score >= 80) return { variant: 'success' as const, label: 'Excellent' };
    if (score >= 60) return { variant: 'info' as const, label: 'Good' };
    if (score >= 40) return { variant: 'warning' as const, label: 'Warning' };
    return { variant: 'danger' as const, label: 'Poor' };
  };

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">History</h1>
            <p className="text-gray-600 mt-1">Manage your uploaded financial datasets</p>
          </div>
          <Link href="/upload">
            <Button className="gap-2">
              <Upload className="w-4 h-4" />
              Upload New File
            </Button>
          </Link>
        </div>

        {/* Search & Filter */}
        <Card className="border border-gray-200">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by filename..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="pdf">PDF</option>
                  <option value="xlsx">Excel</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid sm:grid-cols-4 gap-4">
          <StatCard
            title="Total Datasets"
            value={datasets.length}
            icon={FileText}
            color="blue"
          />
          <StatCard
            title="Total Records"
            value={datasets.reduce((sum, d) => sum + d.data.length, 0).toLocaleString()}
            icon={BarChart2}
            color="green"
          />
          <StatCard
            title="Avg Quality"
            value={`${Math.round(datasets.reduce((sum, d) => sum + d.qualityScore, 0) / (datasets.length || 1))}/100`}
            icon={CheckCircle}
            color="purple"
          />
          <StatCard
            title="Analyzed"
            value={datasets.filter(d => d.analysis).length}
            icon={Eye}
            color="orange"
          />
        </div>

        {/* Datasets List */}
        {filteredDatasets.length === 0 ? (
          <Card className="border-2 border-dashed border-gray-200">
            <CardContent className="py-16 text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Upload className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchQuery || filterType !== 'all' ? 'No datasets match your filters' : 'No datasets yet'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {searchQuery || filterType !== 'all' 
                    ? 'Try adjusting your search or filters'
                    : 'Upload your first financial file to get started'}
                </p>
                <Link href="/upload">
                  <Button size="lg" className="gap-2">
                    <Upload className="w-4 h-4" />
                    Upload File
                  </Button>
                </Link>
              </motion.div>
            </CardContent>
          </Card>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="space-y-4" aria-live="polite">
              {filteredDatasets.map((dataset, index) => (
                <motion.div
                  key={dataset.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <DatasetCard
                    dataset={dataset}
                    isExpanded={expandedId === dataset.id}
                    onToggle={() => setExpandedId(expandedId === dataset.id ? null : dataset.id)}
                    onView={() => {
                      setCurrentDataset(dataset);
                    }}
                    onDelete={() => setShowDeleteConfirm(dataset.id)}
                    deleting={deletingId === dataset.id}
                  />
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
              onClick={() => setShowDeleteConfirm(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-2xl max-w-md w-full p-6"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Delete Dataset?</h3>
                </div>

                <p className="text-gray-600 mb-6">
                  This will permanently delete the dataset and remove it from AI memory. 
                  This action cannot be undone.
                </p>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setShowDeleteConfirm(null)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" className="flex-1" onClick={() => handleDelete(showDeleteConfirm)}>
                    Delete Permanently
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Layout>
  );
}

function StatCard({ title, value, icon: Icon, color }: { title: string; value: string | number; icon: any; color: string }) {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  };
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
          <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', colors[color])}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DatasetCard({ 
  dataset, 
  isExpanded, 
  onToggle, 
  onView, 
  onDelete, 
  deleting 
}: { 
  dataset: UploadedDataset;
  isExpanded: boolean;
  onToggle: () => void;
  onView: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const quality = getQualityBadge(dataset.qualityScore);
  
  return (
    <Card className="overflow-hidden transition-all">
      <CardContent className="p-0">
        {/* Main Row */}
        <button
          onClick={onToggle}
          className="w-full p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left"
          aria-expanded={isExpanded}
        >
          <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
            dataset.fileType === 'pdf' ? 'bg-red-100' : 'bg-green-100'
          )}>
            <FileText className={cn('w-6 h-6', dataset.fileType === 'pdf' ? 'text-red-600' : 'text-green-600')} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="font-semibold text-gray-900 truncate">{dataset.fileName}</h3>
              <Badge variant={dataset.fileType === 'pdf' ? 'danger' : 'success'} size="sm">
                {dataset.fileType.toUpperCase()}
              </Badge>
              <Badge {...quality} variant={quality.variant} size="sm" dot>
                {quality.label}
              </Badge>
              {dataset.analysis && (
                <Badge variant="info" size="sm" dot>
                  Analyzed
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {formatDate(dataset.uploadedAt)}
              </span>
              <span className="flex items-center gap-1">
                <BarChart2 className="w-3.5 h-3.5" />
                {dataset.data.length} records
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <ChevronDown className={cn('w-5 h-5 text-gray-400 transition-transform', isExpanded && 'rotate-180')} />
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onView(); }}>
              <Eye className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onDelete(); }} disabled={deleting}>
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </Button>
          </div>
        </button>

        {/* Expanded Details */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-gray-100 bg-gray-50"
            >
              <div className="p-4 space-y-4">
                {/* Quality Details */}
                <div className="grid sm:grid-cols-4 gap-4">
                  <DetailItem label="Quality Score" value={`${dataset.qualityScore}/100`} />
                  <DetailItem label="Records" value={dataset.data.length.toString()} />
                  <DetailItem label="File Type" value={dataset.fileType.toUpperCase()} />
                  <DetailItem label="Uploaded" value={formatDate(dataset.uploadedAt)} />
                </div>

                {/* Quality Issues */}
                {dataset.qualityIssues.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Quality Issues</h4>
                    <ul className="space-y-1">
                      {dataset.qualityIssues.map((issue, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600 p-2 bg-white rounded-lg">
                          <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Data Preview */}
                {dataset.data.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Data Preview (Latest 5)</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-gray-500 border-b border-gray-200">
                            <th className="pb-2 pr-4">Date</th>
                            <th className="pb-2 pr-4 text-right">Revenue</th>
                            <th className="pb-2 pr-4 text-right">Gross Profit</th>
                            <th className="pb-2 pr-4 text-right">Net Income</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dataset.data.slice(-5).reverse().map((row, i) => (
                            <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-white">
                              <td className="py-2 pr-4 text-gray-600">{formatDate(row.date)}</td>
                              <td className="py-2 pr-4 text-right font-medium">{formatCurrency(row.revenue)}</td>
                              <td className="py-2 pr-4 text-right">{formatCurrency(row.grossProfit)}</td>
                              <td className="py-2 pr-4 text-right font-medium text-green-600">{formatCurrency(row.netIncome)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-200">
                  <Button onClick={onView} className="flex-1 sm:flex-none gap-2">
                    <BarChart2 className="w-4 h-4" />
                    View Dashboard
                  </Button>
                  <Button variant="outline" onClick={onDelete} disabled={deleting} className="flex-1 sm:flex-none">
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-white rounded-lg">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="font-medium text-gray-900">{value}</p>
    </div>
  );
}

// Import missing
import { Loader2 } from 'lucide-react';