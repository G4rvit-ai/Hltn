import { useState } from 'react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { Building2 } from 'lucide-react';

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center gap-12">
        <div className="flex-1 text-center lg:text-left">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="bg-blue-600 p-4 rounded-2xl">
              <Building2 className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">HLTN</h1>
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Hyper Local Trust Network
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            Building trust, communication, and coordination within your residential community.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-1">Community Posts</h3>
              <p className="text-sm text-gray-600">Share announcements and discussions</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-1">Visitor Management</h3>
              <p className="text-sm text-gray-600">Track and approve visitors</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-1">Maintenance Tracking</h3>
              <p className="text-sm text-gray-600">Manage dues and payments</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-1">Issue Resolution</h3>
              <p className="text-sm text-gray-600">Report and track complaints</p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex justify-center">
          {isLogin ? (
            <LoginForm onToggleForm={() => setIsLogin(false)} />
          ) : (
            <RegisterForm onToggleForm={() => setIsLogin(true)} />
          )}
        </div>
      </div>
    </div>
  );
}
