import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { MessageSquare, Users, DollarSign, AlertCircle, TrendingUp } from 'lucide-react';

interface Stats {
  pendingVisitors: number;
  unpaidDues: number;
  recentPosts: number;
  openIssues: number;
}

export function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<Stats>({
    pendingVisitors: 0,
    unpaidDues: 0,
    recentPosts: 0,
    openIssues: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [profile]);

  const loadStats = async () => {
    if (!profile) return;

    try {
      const [visitorsRes, paymentsRes, postsRes, issuesRes] = await Promise.all([
        supabase
          .from('visitors')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending')
          .eq('resident_id', profile.id),

        supabase
          .from('payments')
          .select('id', { count: 'exact', head: true })
          .eq('resident_id', profile.id)
          .eq('status', 'pending'),

        supabase
          .from('posts')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),

        supabase
          .from('issues')
          .select('id', { count: 'exact', head: true })
          .in('status', ['open', 'in_progress']),
      ]);

      setStats({
        pendingVisitors: visitorsRes.count || 0,
        unpaidDues: paymentsRes.count || 0,
        recentPosts: postsRes.count || 0,
        openIssues: issuesRes.count || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Pending Visitors',
      value: stats.pendingVisitors,
      icon: Users,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      title: 'Unpaid Dues',
      value: stats.unpaidDues,
      icon: DollarSign,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      title: 'Recent Posts',
      value: stats.recentPosts,
      icon: MessageSquare,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
    },
    {
      title: 'Open Issues',
      value: stats.openIssues,
      icon: AlertCircle,
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {profile?.full_name}!
        </h1>
        <p className="text-gray-600">
          Here's what's happening in your community today
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${card.bgColor} p-3 rounded-lg`}>
                  <Icon className={`w-6 h-6 ${card.textColor}`} />
                </div>
                <TrendingUp className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-gray-600 text-sm mb-1">{card.title}</p>
              <p className="text-3xl font-bold text-gray-900">{card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
              <p className="font-medium text-blue-900">Create a new post</p>
              <p className="text-sm text-blue-600">Share with your community</p>
            </button>
            <button className="w-full text-left px-4 py-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
              <p className="font-medium text-green-900">Report an issue</p>
              <p className="text-sm text-green-600">Maintenance, security, or housekeeping</p>
            </button>
            <button className="w-full text-left px-4 py-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors">
              <p className="font-medium text-orange-900">View payments</p>
              <p className="text-sm text-orange-600">Check your maintenance dues</p>
            </button>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm p-6 text-white">
          <h2 className="text-xl font-bold mb-4">Community Updates</h2>
          <div className="space-y-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <p className="font-medium mb-1">Stay Connected</p>
              <p className="text-sm text-blue-100">
                Join the community feed to stay updated with announcements and discussions
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <p className="font-medium mb-1">Security First</p>
              <p className="text-sm text-blue-100">
                Approve or reject visitor requests to keep your community safe
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
