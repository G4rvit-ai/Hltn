import { useState } from 'react';
import { Sidebar } from './Layout/Sidebar';
import { Dashboard } from './Dashboard/Dashboard';
import { PostsFeed } from './Posts/PostsFeed';
import { VisitorManagement } from './Visitors/VisitorManagement';
import { PaymentsDashboard } from './Payments/PaymentsDashboard';
import { IssueManagement } from './Issues/IssueManagement';
import { UserProfile } from './Profile/UserProfile';

export function MainApp() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'posts':
        return <PostsFeed />;
      case 'visitors':
        return <VisitorManagement />;
      case 'payments':
        return <PaymentsDashboard />;
      case 'issues':
        return <IssueManagement />;
      case 'profile':
        return <UserProfile />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6 lg:p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
