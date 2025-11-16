import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Check, X, LogOut, Clock, Phone, User } from 'lucide-react';
import type { Database } from '../../lib/database.types';

type Visitor = Database['public']['Tables']['visitors']['Row'] & {
  profiles: Database['public']['Tables']['profiles']['Row'] | null;
};

export function VisitorManagement() {
  const { profile } = useAuth();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'checked_out'>('all');

  useEffect(() => {
    loadVisitors();
  }, [profile, filter]);

  const loadVisitors = async () => {
    if (!profile) return;

    try {
      let query = supabase
        .from('visitors')
        .select(`
          *,
          profiles!visitors_resident_id_fkey(id, full_name, flat_number)
        `)
        .order('created_at', { ascending: false });

      if (profile.role === 'resident') {
        query = query.eq('resident_id', profile.id);
      }

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setVisitors(data as unknown as Visitor[]);
    } catch (error) {
      console.error('Error loading visitors:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateVisitorStatus = async (visitorId: string, status: 'approved' | 'rejected' | 'checked_out') => {
    try {
      const updateData: any = { status };
      if (status === 'checked_out') {
        updateData.check_out_time = new Date().toISOString();
      }

      const { error } = await supabase
        .from('visitors')
        .update(updateData)
        .eq('id', visitorId);

      if (error) throw error;
      loadVisitors();
    } catch (error) {
      console.error('Error updating visitor status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      case 'checked_out':
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Visitor Management</h1>
          <p className="text-gray-600">Track and manage visitor access to your community</p>
        </div>
        {(profile?.role === 'security' || profile?.role === 'admin') && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Visitor
          </button>
        )}
      </div>

      <div className="flex gap-2">
        {(['all', 'pending', 'approved', 'checked_out'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1).replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {visitors.length === 0 ? (
          <div className="col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No visitors found</h3>
            <p className="text-gray-600">
              {filter === 'all' ? 'No visitors have been registered yet' : `No ${filter} visitors`}
            </p>
          </div>
        ) : (
          visitors.map((visitor) => (
            <div
              key={visitor.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{visitor.visitor_name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                    <Phone className="w-4 h-4" />
                    {visitor.visitor_phone}
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(visitor.status)}`}>
                  {visitor.status}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="font-medium">Flat:</span>
                  <span>{visitor.flat_number}</span>
                  {visitor.profiles && (
                    <span className="text-gray-500">({visitor.profiles.full_name})</span>
                  )}
                </div>
                {visitor.purpose && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="font-medium">Purpose:</span>
                    <span>{visitor.purpose}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>Check-in: {new Date(visitor.check_in_time).toLocaleString()}</span>
                </div>
                {visitor.check_out_time && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <LogOut className="w-4 h-4" />
                    <span>Check-out: {new Date(visitor.check_out_time).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {visitor.status === 'pending' && profile?.role === 'resident' && visitor.resident_id === profile.id && (
                <div className="flex gap-2">
                  <button
                    onClick={() => updateVisitorStatus(visitor.id, 'approved')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => updateVisitorStatus(visitor.id, 'rejected')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              )}

              {visitor.status === 'approved' && (profile?.role === 'security' || profile?.role === 'admin') && (
                <button
                  onClick={() => updateVisitorStatus(visitor.id, 'checked_out')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Check Out
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {showAddModal && (
        <AddVisitorModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadVisitors();
          }}
        />
      )}
    </div>
  );
}

interface AddVisitorModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function AddVisitorModal({ onClose, onSuccess }: AddVisitorModalProps) {
  const { profile } = useAuth();
  const [residents, setResidents] = useState<Database['public']['Tables']['profiles']['Row'][]>([]);
  const [formData, setFormData] = useState({
    visitor_name: '',
    visitor_phone: '',
    flat_number: '',
    resident_id: '',
    purpose: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadResidents();
  }, []);

  const loadResidents = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'resident')
        .order('flat_number');

      if (error) throw error;
      setResidents(data);
    } catch (error) {
      console.error('Error loading residents:', error);
    }
  };

  const handleResidentChange = (residentId: string) => {
    const resident = residents.find((r) => r.id === residentId);
    if (resident) {
      setFormData({
        ...formData,
        resident_id: residentId,
        flat_number: resident.flat_number,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('visitors').insert({
        visitor_name: formData.visitor_name,
        visitor_phone: formData.visitor_phone,
        flat_number: formData.flat_number,
        resident_id: formData.resident_id || null,
        purpose: formData.purpose,
        added_by: profile.id,
      });

      if (error) throw error;
      onSuccess();
    } catch (error) {
      console.error('Error adding visitor:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Add New Visitor</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Visitor Name
            </label>
            <input
              type="text"
              value={formData.visitor_name}
              onChange={(e) => setFormData({ ...formData, visitor_name: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter visitor's name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Visitor Phone
            </label>
            <input
              type="tel"
              value={formData.visitor_phone}
              onChange={(e) => setFormData({ ...formData, visitor_phone: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter phone number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Visiting Resident
            </label>
            <select
              value={formData.resident_id}
              onChange={(e) => handleResidentChange(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a resident</option>
              {residents.map((resident) => (
                <option key={resident.id} value={resident.id}>
                  {resident.flat_number} - {resident.full_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Purpose of Visit
            </label>
            <input
              type="text"
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Personal visit, Delivery, Service"
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
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Add Visitor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
