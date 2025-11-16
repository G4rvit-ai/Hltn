import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, DollarSign, Calendar, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import type { Database } from '../../lib/database.types';

type Payment = Database['public']['Tables']['payments']['Row'] & {
  profiles: Database['public']['Tables']['profiles']['Row'];
};

export function PaymentsDashboard() {
  const { profile } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  useEffect(() => {
    loadPayments();
  }, [profile]);

  const loadPayments = async () => {
    if (!profile) return;

    try {
      let query = supabase
        .from('payments')
        .select(`
          *,
          profiles!payments_resident_id_fkey(id, full_name, flat_number)
        `)
        .order('due_date', { ascending: false });

      if (profile.role === 'resident') {
        query = query.eq('resident_id', profile.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPayments(data as unknown as Payment[]);
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsPaid = async (paymentId: string, transactionId: string) => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({
          status: 'paid',
          transaction_id: transactionId,
          paid_at: new Date().toISOString(),
        })
        .eq('id', paymentId);

      if (error) throw error;
      loadPayments();
    } catch (error) {
      console.error('Error marking payment as paid:', error);
    }
  };

  const verifyPayment = async (paymentId: string) => {
    if (profile?.role !== 'admin') return;

    try {
      const { error } = await supabase
        .from('payments')
        .update({
          status: 'verified',
          verified_by: profile.id,
          verified_at: new Date().toISOString(),
        })
        .eq('id', paymentId);

      if (error) throw error;
      loadPayments();
    } catch (error) {
      console.error('Error verifying payment:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'paid':
        return 'bg-blue-100 text-blue-700';
      case 'verified':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'paid':
        return <AlertTriangle className="w-4 h-4" />;
      case 'verified':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const isOverdue = (dueDate: string, status: string) => {
    return status === 'pending' && new Date(dueDate) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const totalPending = payments
    .filter((p) => p.status === 'pending' && p.resident_id === profile?.id)
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payments & Maintenance</h1>
          <p className="text-gray-600">Track and manage maintenance dues</p>
        </div>
        {profile?.role === 'admin' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Payment Request
          </button>
        )}
      </div>

      {profile?.role === 'resident' && totalPending > 0 && (
        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl shadow-sm p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 mb-1">Total Pending Dues</p>
              <p className="text-4xl font-bold">₹{totalPending.toFixed(2)}</p>
            </div>
            <DollarSign className="w-16 h-16 text-white opacity-50" />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {payments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No payment records</h3>
            <p className="text-gray-600">Payment requests will appear here</p>
          </div>
        ) : (
          payments.map((payment) => {
            const overdue = isOverdue(payment.due_date, payment.status);
            return (
              <div
                key={payment.id}
                className={`bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow ${
                  overdue ? 'border-red-300 ring-2 ring-red-100' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{payment.description}</h3>
                      {overdue && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
                          Overdue
                        </span>
                      )}
                    </div>
                    {profile?.role === 'admin' && (
                      <p className="text-sm text-gray-600">
                        Resident: {payment.profiles.full_name} ({payment.profiles.flat_number})
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-gray-900">₹{Number(payment.amount).toFixed(2)}</p>
                    <div className="flex items-center justify-end gap-2 mt-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(payment.status)}`}>
                        {getStatusIcon(payment.status)}
                        {payment.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span className="font-medium">Due Date:</span>
                    <span>{new Date(payment.due_date).toLocaleDateString()}</span>
                  </div>
                  {payment.transaction_id && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="font-medium">Transaction ID:</span>
                      <span className="font-mono">{payment.transaction_id}</span>
                    </div>
                  )}
                  {payment.paid_at && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="font-medium">Paid On:</span>
                      <span>{new Date(payment.paid_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {payment.status === 'pending' && profile?.role === 'resident' && payment.resident_id === profile.id && (
                  <button
                    onClick={() => {
                      setSelectedPayment(payment);
                      setShowPayModal(true);
                    }}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Mark as Paid
                  </button>
                )}

                {payment.status === 'paid' && profile?.role === 'admin' && (
                  <button
                    onClick={() => verifyPayment(payment.id)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Verify Payment
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {showCreateModal && (
        <CreatePaymentModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadPayments();
          }}
        />
      )}

      {showPayModal && selectedPayment && (
        <PaymentModal
          payment={selectedPayment}
          onClose={() => {
            setShowPayModal(false);
            setSelectedPayment(null);
          }}
          onSuccess={(transactionId) => {
            markAsPaid(selectedPayment.id, transactionId);
            setShowPayModal(false);
            setSelectedPayment(null);
          }}
        />
      )}
    </div>
  );
}

interface CreatePaymentModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function CreatePaymentModal({ onClose, onSuccess }: CreatePaymentModalProps) {
  const [residents, setResidents] = useState<Database['public']['Tables']['profiles']['Row'][]>([]);
  const [formData, setFormData] = useState({
    resident_id: '',
    amount: '',
    description: '',
    due_date: '',
  });
  const [loading, setLoading] = useState(false);
  const [applyToAll, setApplyToAll] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (applyToAll) {
        const payments = residents.map((resident) => ({
          resident_id: resident.id,
          amount: Number(formData.amount),
          description: formData.description,
          due_date: formData.due_date,
        }));

        const { error } = await supabase.from('payments').insert(payments);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('payments').insert({
          resident_id: formData.resident_id,
          amount: Number(formData.amount),
          description: formData.description,
          due_date: formData.due_date,
        });

        if (error) throw error;
      }

      onSuccess();
    } catch (error) {
      console.error('Error creating payment:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Create Payment Request</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              id="applyToAll"
              checked={applyToAll}
              onChange={(e) => setApplyToAll(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="applyToAll" className="text-sm font-medium text-gray-700">
              Apply to all residents
            </label>
          </div>

          {!applyToAll && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Resident
              </label>
              <select
                value={formData.resident_id}
                onChange={(e) => setFormData({ ...formData, resident_id: e.target.value })}
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
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Monthly Maintenance - January 2024"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount (₹)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
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
              {loading ? 'Creating...' : 'Create Payment Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface PaymentModalProps {
  payment: Payment;
  onClose: () => void;
  onSuccess: (transactionId: string) => void;
}

function PaymentModal({ payment, onClose, onSuccess }: PaymentModalProps) {
  const [transactionId, setTransactionId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    onSuccess(transactionId);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Mark Payment as Paid</h2>
        </div>

        <div className="p-6">
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600 mb-1">Payment Description</p>
            <p className="font-semibold text-gray-900">{payment.description}</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">₹{Number(payment.amount).toFixed(2)}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transaction ID / Reference Number
              </label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter transaction reference"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter your bank transaction ID or payment reference number
              </p>
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
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Payment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
