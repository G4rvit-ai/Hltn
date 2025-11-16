import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Pin, MessageCircle, Clock, AlertCircle as AlertIcon } from 'lucide-react';
import type { Database } from '../../lib/database.types';

type Post = Database['public']['Tables']['posts']['Row'] & {
  profiles: Database['public']['Tables']['profiles']['Row'];
  post_comments: { count: number }[];
};

export function PostsFeed() {
  const { profile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_author_id_fkey(id, full_name, flat_number, role),
          post_comments(count)
        `)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data as unknown as Post[]);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePin = async (postId: string, currentPinned: boolean) => {
    if (profile?.role !== 'admin') return;

    try {
      const { error } = await supabase
        .from('posts')
        .update({ is_pinned: !currentPinned })
        .eq('id', postId);

      if (error) throw error;
      loadPosts();
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  };

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case 'announcement':
        return 'bg-blue-100 text-blue-700';
      case 'alert':
        return 'bg-red-100 text-red-700';
      case 'poll':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return <AlertIcon className="w-4 h-4" />;
      default:
        return <MessageCircle className="w-4 h-4" />;
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
          <h1 className="text-3xl font-bold text-gray-900">Community Feed</h1>
          <p className="text-gray-600">Stay updated with community announcements and discussions</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Post
        </button>
      </div>

      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
            <p className="text-gray-600 mb-4">Be the first to share something with your community</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create First Post
            </button>
          </div>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow ${
                post.is_pinned ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-gray-100 w-12 h-12 rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold text-gray-700">
                      {post.profiles.full_name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{post.profiles.full_name}</h3>
                      <span className="text-sm text-gray-500">{post.profiles.flat_number}</span>
                      {post.profiles.role === 'admin' && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                          Admin
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      {new Date(post.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getPostTypeColor(post.post_type)}`}>
                    {getPostTypeIcon(post.post_type)}
                    {post.post_type}
                  </span>
                  {post.is_pinned && (
                    <Pin className="w-5 h-5 text-blue-600 fill-current" />
                  )}
                  {profile?.role === 'admin' && (
                    <button
                      onClick={() => togglePin(post.id, post.is_pinned)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Pin className={`w-5 h-5 ${post.is_pinned ? 'text-blue-600' : 'text-gray-400'}`} />
                    </button>
                  )}
                </div>
              </div>

              <h2 className="text-xl font-bold text-gray-900 mb-2">{post.title}</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <button className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                    <MessageCircle className="w-4 h-4" />
                    <span>{post.post_comments?.[0]?.count || 0} Comments</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showCreateModal && (
        <CreatePostModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadPosts();
          }}
        />
      )}
    </div>
  );
}

interface CreatePostModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function CreatePostModal({ onClose, onSuccess }: CreatePostModalProps) {
  const { profile } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    post_type: 'discussion' as 'announcement' | 'discussion' | 'poll' | 'alert',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('posts').insert({
        author_id: profile.id,
        title: formData.title,
        content: formData.content,
        post_type: formData.post_type,
      });

      if (error) throw error;
      onSuccess();
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Create New Post</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Post Type
            </label>
            <select
              value={formData.post_type}
              onChange={(e) => setFormData({ ...formData, post_type: e.target.value as any })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="discussion">Discussion</option>
              <option value="announcement">Announcement</option>
              <option value="alert">Alert</option>
              <option value="poll">Poll</option>
            </select>
          </div>

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
              placeholder="What's this about?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Share your thoughts..."
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
              {loading ? 'Creating...' : 'Create Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
