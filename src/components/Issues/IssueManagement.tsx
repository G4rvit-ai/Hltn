import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, AlertCircle, Wrench, Shield, Sparkles, MessageSquare, AlertTriangle } from 'lucide-react';
import type { Database } from '../../lib/database.types';

type Issue = Database['public']['Tables']['issues']['Row'] & {
  reporter: Database['public']['Tables']['profiles']['Row'];
  assignee: Database['public']['Tables']['profiles']['Row'] | null;
  is_sos?: boolean;
};

export function IssueManagement() {
  const { profile } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved' | 'sos'>('all');

  useEffect(() => {
    loadIssues();
  }, [filter]);

  const loadIssues = async () => {
    try {
      let query = supabase
        .from('issues')
        .select(`
          *,
          reporter:profiles!issues_reported_by_fkey(id, full_name, flat_number),
          assignee:profiles!issues_assigned_to_fkey(id, full_name, role)
        `);

      if (filter === 'sos') {
        query = query.eq('is_sos', true).order('created_at', { ascending: false });
      } else {
        query = query.order('is_sos', { ascending: false }).order('created_at', { ascending: false });
        if (filter !== 'all') {
          query = query.eq('status', filter);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      setIssues(data as unknown as Issue[]);
    } catch (error) {
      console.error('Error loading issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateIssueStatus = async (issueId: string, status: 'open' | 'in_progress' | 'resolved') => {
    if (profile?.role !== 'admin') return;

    try {
      const { error } = await supabase
        .from('issues')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', issueId);

      if (error) throw error;
      loadIssues();
    } catch (error) {
      console.error('Error updating issue status:', error);
    }
  };

  const toggleSOS = async (issue: Issue) => {
    if (profile?.role !== 'admin' || issue.status === 'resolved') return;

    try {
      const { error } = await supabase
        .from('issues')
        .update({
          is_sos: !issue.is_sos,
          updated_at: new Date().toISOString(),
        })
        .eq('id', issue.id);

      if (error) throw error;
      loadIssues();
    } catch (error) {
      console.error('Error toggling SOS:', error);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'maintenance':
        return <Wrench className="w-5 h-5" />;
      case 'security':
        return <Shield className="w-5 h-5" />;
      case 'housekeeping':
        return <Sparkles className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'maintenance':
        return 'bg-blue-100 text-blue-700';
      case 'security':
        return 'bg-red-100 text-red-700';
      case 'housekeeping':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-yellow-100 text-yellow-700';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700';
      case 'resolved':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string, isSOS?: boolean) => {
    if (isSOS) {
      return 'bg-red-600 text-white animate-pulse ring-2 ring-red-300';
    }
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 ring-2 ring-red-200';
      case 'medium':
        return 'bg-orange-100 text-orange-700';
      case 'low':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const sosIssues = issues.filter((i) => i.is_sos);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Issues & Complaints</h1>
          <p className="text-gray-600">Report and track community issues</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Report Issue
        </button>
      </div>

      {sosIssues.length > 0 && (
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white border-2 border-red-700">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="w-7 h-7 animate-bounce" />
            <h2 className="text-2xl font-bold">SOS Alerts - Urgent Issues</h2>
          </div>
          <p className="text-red-100 mb-4">
            {sosIssues.length} urgent {sosIssues.length === 1 ? 'issue' : 'issues'} requiring immediate attention
          </p>
          <div className="space-y-2">
            {sosIssues.slice(0, 3).map((issue) => (
              <div
                key={issue.id}
                className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-3 cursor-pointer hover:bg-opacity-20 transition-all"
                onClick={() => setSelectedIssue(issue)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-semibold">{issue.title}</p>
                    <p className="text-sm text-red-100">
                      {issue.reporter.full_name} ({issue.reporter.flat_number}) • {new Date(issue.created_at).toLocaleString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(issue.status)}`}>
                    {issue.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {(['all', 'sos', 'open', 'in_progress', 'resolved'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              filter === f
                ? f === 'sos'
                  ? 'bg-red-600 text-white'
                  : 'bg-blue-600 text-white'
                : f === 'sos'
                  ? 'bg-red-50 text-red-700 border border-red-300 hover:bg-red-100'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {f === 'sos' && <AlertTriangle className="w-4 h-4" />}
            {f === 'all' ? 'All' : f === 'sos' ? 'SOS Alerts' : f.charAt(0).toUpperCase() + f.slice(1).replace('_', ' ')}
            {f === 'sos' && sosIssues.length > 0 && (
              <span className="bg-white text-red-600 px-2 py-0.5 rounded-full text-xs font-bold">
                {sosIssues.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {issues.length === 0 ? (
          <div className="col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No issues found</h3>
            <p className="text-gray-600">
              {filter === 'sos'
                ? 'No SOS alerts have been reported'
                : filter === 'all'
                  ? 'No issues have been reported yet'
                  : `No ${filter.replace('_', ' ')} issues`}
            </p>
          </div>
        ) : (
          issues.map((issue) => (
            <div
              key={issue.id}
              className={`bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-all cursor-pointer ${
                issue.is_sos
                  ? 'border-red-500 ring-2 ring-red-300 ring-opacity-50'
                  : issue.priority === 'high'
                    ? 'border-red-300'
                    : 'border-gray-200'
              }`}
              onClick={() => setSelectedIssue(issue)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`p-2 rounded-lg ${getCategoryColor(issue.category)}`}>
                    {getCategoryIcon(issue.category)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-gray-900">{issue.title}</h3>
                      {issue.is_sos && (
                        <AlertTriangle className="w-5 h-5 text-red-600 animate-pulse" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      Reported by {issue.reporter.full_name} ({issue.reporter.flat_number})
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded text-xs font-bold whitespace-nowrap ml-2 ${getPriorityColor(issue.priority, issue.is_sos)}`}>
                  {issue.is_sos ? 'SOS' : issue.priority}
                </span>
              </div>

              <p className="text-gray-700 mb-4 line-clamp-2">{issue.description}</p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(issue.status)}`}>
                    {issue.status.replace('_', ' ')}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(issue.category)}`}>
                    {issue.category}
                  </span>
                </div>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" />
                  View Details
                </button>
              </div>

              {issue.assignee && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Assigned to: <span className="font-medium text-gray-900">{issue.assignee.full_name}</span>
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {showCreateModal && (
        <CreateIssueModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadIssues();
          }}
        />
      )}

      {selectedIssue && (
        <IssueDetailModal
          issue={selectedIssue}
          onClose={() => setSelectedIssue(null)}
          onStatusUpdate={(status) => {
            updateIssueStatus(selectedIssue.id, status);
            setSelectedIssue(null);
          }}
          onSOSToggle={() => toggleSOS(selectedIssue)}
        />
      )}
    </div>
  );
}

interface CreateIssueModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function CreateIssueModal({ onClose, onSuccess }: CreateIssueModalProps) {
  const { profile } = useAuth();
  const [formData, setFormData] = useState({
    category: 'maintenance' as 'maintenance' | 'security' | 'housekeeping',
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    is_sos: false,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('issues').insert({
        reported_by: profile.id,
        category: formData.category,
        title: formData.title,
        description: formData.description,
        priority: formData.is_sos ? 'high' : formData.priority,
        is_sos: formData.is_sos,
      });

      if (error) throw error;
      onSuccess();
    } catch (error) {
      console.error('Error creating issue:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Report New Issue</h2>
          <p className="text-sm text-gray-600 mt-1">Use SOS for urgent safety/security issues requiring immediate attention</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="maintenance">Maintenance</option>
              <option value="security">Security</option>
              <option value="housekeeping">Housekeeping</option>
            </select>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_sos}
                onChange={(e) => setFormData({ ...formData, is_sos: e.target.checked })}
                className="w-4 h-4 text-red-600 rounded focus:ring-2 focus:ring-red-500"
              />
              <div>
                <p className="font-semibold text-red-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Mark as SOS (Urgent/Emergency)
                </p>
                <p className="text-sm text-red-700 mt-1">
                  Use this for urgent safety or security issues that need immediate attention
                </p>
              </div>
            </label>
          </div>

          {!formData.is_sos && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Brief description of the issue"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={5}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Provide detailed information about the issue..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                formData.is_sos
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? 'Submitting...' : 'Submit Issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface IssueDetailModalProps {
  issue: Issue;
  onClose: () => void;
  onStatusUpdate: (status: 'open' | 'in_progress' | 'resolved') => void;
  onSOSToggle: () => void;
}

function IssueDetailModal({ issue, onClose, onStatusUpdate, onSOSToggle }: IssueDetailModalProps) {
  const { profile } = useAuth();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className={`p-6 border-b-2 ${issue.is_sos ? 'bg-red-50 border-red-300' : 'border-gray-200'}`}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-gray-900">{issue.title}</h2>
                {issue.is_sos && (
                  <div className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded-full text-xs font-bold animate-pulse">
                    <AlertTriangle className="w-4 h-4" />
                    SOS
                  </div>
                )}
                {!issue.is_sos && (
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${issue.priority === 'high' ? 'bg-red-100 text-red-700' : issue.priority === 'medium' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'}`}>
                    {issue.priority} priority
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">
                Reported by {issue.reporter.full_name} ({issue.reporter.flat_number})
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${issue.status === 'resolved' ? 'bg-green-100 text-green-700' : issue.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {issue.status.replace('_', ' ')}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${issue.category === 'maintenance' ? 'bg-blue-100 text-blue-700' : issue.category === 'security' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {issue.category}
              </span>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{issue.description}</p>
          </div>

          {issue.assignee && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Assigned To</h3>
              <p className="text-gray-700">{issue.assignee.full_name}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Created</h3>
              <p className="text-sm text-gray-600">
                {new Date(issue.created_at).toLocaleString()}
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Last Updated</h3>
              <p className="text-sm text-gray-600">
                {new Date(issue.updated_at).toLocaleString()}
              </p>
            </div>
          </div>

          {profile?.role === 'admin' && issue.status !== 'resolved' && (
            <div className="pt-4 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">Admin Actions</h3>
              <div className="space-y-3">
                <div className="flex gap-3">
                  {issue.status !== 'in_progress' && (
                    <button
                      onClick={() => onStatusUpdate('in_progress')}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Mark In Progress
                    </button>
                  )}
                  <button
                    onClick={() => onStatusUpdate('resolved')}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Mark Resolved
                  </button>
                </div>

                <button
                  onClick={onSOSToggle}
                  className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                    issue.is_sos
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      : 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-300'
                  }`}
                >
                  {issue.is_sos ? 'Remove SOS Status' : 'Mark as SOS (Urgent)'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function X({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
