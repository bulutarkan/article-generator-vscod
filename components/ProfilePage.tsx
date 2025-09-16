import React, { useState, FormEvent, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { User, Article } from '../types';
import * as supabaseService from '../services/supabase';
import { LockIcon } from './icons/LockIcon';
import { UserCogIcon } from './icons/UserCogIcon';
import { FilesIcon } from './icons/FilesIcon';
import { FileTextIcon } from './icons/FileTextIcon';
import { BarChartIcon } from './icons/BarChartIcon';
import { HashIcon } from './icons/HashIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { TrashIcon } from './icons/TrashIcon';
import { CheckIcon } from './icons/CheckIcon';
import { IntegrationsManager } from './IntegrationsManager';
import { ArticleCard } from './ArticleCard';
import { AppPageTitle } from './PageTitle';

interface ProfilePageProps {
  onBackToApp: () => void;
  onNavigateToDashboard: () => void;
  currentUser: User;
  onLogout: () => void;
  articles: Article[];
  onDeleteArticle: (id: string) => void;
  onViewArticle: (id: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  onBackToApp,
  onNavigateToDashboard,
  currentUser,
  onLogout,
  articles,
  onDeleteArticle,
  onViewArticle
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [recentArticles, setRecentArticles] = useState<Article[]>([]);

    useEffect(() => {
      // Get recent 3 articles for preview
      const recent = articles.slice(0, 3);
      setRecentArticles(recent);
    }, [articles]);

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setError(null);
        setSuccess(null);

        if (newPassword !== confirmPassword) {
            setError("New passwords do not match.");
            return;
        }

        setIsLoading(true);
        try {
            await supabaseService.changePassword(newPassword);
            setSuccess("Password changed successfully!");
            setNewPassword('');
            setConfirmPassword('');
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleProfileUpdate = async (event: FormEvent) => {
      event.preventDefault();
      setError(null);
      setSuccess(null);

      setIsLoading(true);
      try {
        await supabaseService.updateProfile({
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          username: username || undefined,
        });
        setSuccess("Profile updated successfully!");
      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    };

    const handleDeleteAccount = async () => {
      if (deleteConfirmText !== 'DELETE') {
        setError("Please type 'DELETE' to confirm account deletion.");
        return;
      }

      setIsLoading(true);
      try {
        // TODO: Implement account deletion
        await supabaseService.deleteAccount();
        setSuccess("Account deleted successfully!");
        onLogout();
      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    };

    // Calculate stats
    const stats = React.useMemo(() => {
      if (articles.length === 0) {
        return {
          totalArticles: 0,
          totalWords: 0,
          avgDifficulty: 0,
          uniqueKeywords: 0
        };
      }

      const totalWords = articles.reduce((sum, article) => {
        if (!article.articleContent || article.articleContent.trim() === '') {
          return sum;
        }
        return sum + article.articleContent.trim().split(/\s+/).length;
      }, 0);

      const totalDifficulty = articles.reduce((sum, article) => sum + (article.keywordDifficulty || 0), 0);
      const avgDifficulty = articles.length > 0 ? (totalDifficulty / articles.length).toFixed(1) : '0';

      const uniqueKeywords = new Set(articles.map(a => a.primaryKeyword)).size;

      return {
        totalArticles: articles.length,
        totalWords: totalWords.toLocaleString(),
        avgDifficulty,
        uniqueKeywords
      };
    }, [articles]);

    const StatCard: React.FC<{ icon: React.FC<React.SVGProps<SVGSVGElement>>; label: string; value: string | number; }> = ({ icon: Icon, label, value }) => (
      <div className="bg-slate-800/70 p-4 rounded-xl border border-slate-700 flex items-start gap-3 h-full">
        <div className="p-2 bg-indigo-500/10 rounded-lg">
          <Icon className="h-5 w-5 text-indigo-400" />
        </div>
        <div>
          <p className="text-xs text-slate-400">{label}</p>
          <p className="text-xl font-bold text-white mt-1">{value}</p>
        </div>
      </div>
    );

  return (
    <>
      <AppPageTitle pageName="Profile" />
      <header className="py-8 text-center px-4">
        <div className="flex justify-between items-center w-full max-w-7xl mx-auto">
          <div className="text-left">
            <button onClick={onBackToApp} className="px-4 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-white/10 transition-colors">
              &larr; Back to App
            </button>
          </div>
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              User Profile
            </h1>
          </div>
          <div className="text-right">
             <div className="flex items-center gap-2">
              <button onClick={onLogout} className="px-4 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-red-500/20 hover:text-red-300 transition-colors">Logout</button>
            </div>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 w-full flex-1 overflow-y-auto">
         <div className="max-w-6xl mx-auto space-y-8 animate-fade-in-up">
            {/* User Info */}
            <div className="bg-white/5 p-6 sm:p-8 rounded-2xl shadow-lg backdrop-blur-xl border border-white/10">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-700 rounded-full">
                        <UserCogIcon className="h-8 w-8 text-slate-300" />
                    </div>
                    <div>
                        <p className="text-xl font-bold text-slate-200">
                          {currentUser.firstName && currentUser.lastName
                            ? `${currentUser.firstName} ${currentUser.lastName}`
                            : currentUser.username}
                        </p>
                        <p className="text-sm text-slate-400">@{currentUser.username}</p>
                        <p className="text-sm text-slate-400 capitalize bg-indigo-500/20 text-indigo-300 w-fit px-2 py-0.5 rounded-full mt-1">{currentUser.role}</p>
                        <p className="text-sm text-slate-500 mt-1">{currentUser.email}</p>
                    </div>
                </div>
            </div>

            {/* Personal Information */}
            <div className="bg-white/5 p-6 sm:p-8 rounded-2xl shadow-lg backdrop-blur-xl border border-white/10">
                <h2 className="text-2xl font-bold text-slate-100 mb-6">Personal Information</h2>
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="profileFirstName" className="block text-sm font-medium text-slate-300 mb-2">First Name</label>
                            <input
                                type="text"
                                id="profileFirstName"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                placeholder={currentUser.firstName || ''}
                                className="block w-full rounded-md border-0 bg-white/5 py-3 px-3 text-white ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm transition-all"
                            />
                        </div>
                        <div>
                            <label htmlFor="profileLastName" className="block text-sm font-medium text-slate-300 mb-2">Last Name</label>
                            <input
                                type="text"
                                id="profileLastName"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                placeholder={currentUser.lastName || ''}
                                className="block w-full rounded-md border-0 bg-white/5 py-3 px-3 text-white ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm transition-all"
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="profileUsername" className="block text-sm font-medium text-slate-300 mb-2">Username</label>
                        <input
                            type="text"
                            id="profileUsername"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder={currentUser.username}
                            className="block w-full rounded-md border-0 bg-white/5 py-3 px-3 text-white ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm transition-all"
                        />
                    </div>

                    {error && <p className="text-sm text-red-400 text-center">{error}</p>}
                    {success && <p className="text-sm text-green-400 text-center">{success}</p>}

                    <button type="submit" disabled={isLoading} className="flex w-full justify-center items-center rounded-md bg-indigo-500 px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 disabled:bg-indigo-500/50">
                        {isLoading ? 'Saving...' : 'Update Profile'}
                    </button>
                </form>
            </div>

            {/* Publishing Integrations */}
            <IntegrationsManager currentUser={currentUser} />

            {/* Account Statistics */}
            <div className="bg-white/5 p-6 sm:p-8 rounded-2xl shadow-lg backdrop-blur-xl border border-white/10">
                <h2 className="text-2xl font-bold text-slate-100 mb-6">Account Statistics</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard icon={FilesIcon} label="Total Articles" value={stats.totalArticles} />
                  <StatCard icon={FileTextIcon} label="Total Words" value={stats.totalWords} />
                  <StatCard icon={BarChartIcon} label="Avg. KW Difficulty" value={stats.avgDifficulty} />
                  <StatCard icon={HashIcon} label="Unique Keywords" value={stats.uniqueKeywords} />
                </div>
            </div>

            {/* Recent Articles */}
            <div className="bg-white/5 p-6 sm:p-8 rounded-2xl shadow-lg backdrop-blur-xl border border-white/10">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-100">Recent Articles</h2>
                  <button
                    onClick={onNavigateToDashboard}
                    className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-400 transition-colors text-sm"
                  >
                    View All Articles
                  </button>
                </div>
                {recentArticles.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {recentArticles.map((article) => (
                      <ArticleCard
                        key={article.id}
                        article={article}
                        onDelete={onDeleteArticle}
                        onView={onViewArticle}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-center py-8">No articles yet. Start creating!</p>
                )}
            </div>

            {/* Activity History */}
            <div className="bg-white/5 p-6 sm:p-8 rounded-2xl shadow-lg backdrop-blur-xl border border-white/10">
                <h2 className="text-2xl font-bold text-slate-100 mb-6">Activity History</h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-lg">
                    <div className="p-2 bg-green-500/10 rounded-lg">
                      <CalendarIcon className="h-5 w-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-slate-200 font-medium">Account Created</p>
                      <p className="text-sm text-slate-400">Welcome to Article Generator!</p>
                    </div>
                  </div>
                  {articles.length > 0 && (
                    <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-lg">
                      <div className="p-2 bg-blue-500/10 rounded-lg">
                        <FilesIcon className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-slate-200 font-medium">First Article Created</p>
                        <p className="text-sm text-slate-400">{articles[articles.length - 1]?.createdAt || 'Recently'}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-lg">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                      <UserCogIcon className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-slate-200 font-medium">Last Login</p>
                      <p className="text-sm text-slate-400">Today</p>
                    </div>
                  </div>
                </div>
            </div>



            {/* Change Password */}
            <div className="bg-white/5 p-6 sm:p-8 rounded-2xl shadow-lg backdrop-blur-xl border border-white/10">
                 <h2 className="text-2xl font-bold text-slate-100 mb-6">Change Password</h2>
                 <form onSubmit={handleSubmit} className="space-y-6">
                     <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-slate-300 mb-2">New Password</label>
                        <div className="relative"><div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><LockIcon className="h-5 w-5 text-slate-500" /></div>
                            <input type="password" id="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="block w-full rounded-md border-0 bg-white/5 py-3 pl-10 pr-3 text-white ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500" required />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-2">Confirm New Password</label>
                        <div className="relative"><div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><LockIcon className="h-5 w-5 text-slate-500" /></div>
                            <input type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="block w-full rounded-md border-0 bg-white/5 py-3 pl-10 pr-3 text-white ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500" required />
                        </div>
                    </div>

                    {error && <p className="text-sm text-red-400 text-center">{error}</p>}
                    {success && <p className="text-sm text-green-400 text-center">{success}</p>}
                    
                    <button type="submit" disabled={isLoading} className="flex w-full justify-center items-center rounded-md bg-indigo-500 px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 disabled:bg-indigo-500/50">
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                 </form>
            </div>

            {/* Delete Account */}
            <div className="bg-white/5 p-6 sm:p-8 rounded-2xl shadow-lg backdrop-blur-xl border border-white/10">
                <h2 className="text-2xl font-bold text-slate-100 mb-6">Danger Zone</h2>
                <div className="space-y-4">
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-red-500/20 rounded-lg">
                        <TrashIcon className="h-5 w-5 text-red-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-red-300">Delete Account</h3>
                        <p className="text-sm text-red-200">This action cannot be undone. All your data will be permanently deleted.</p>
                      </div>
                    </div>

                    {!showDeleteConfirm ? (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-400 transition-colors text-sm"
                      >
                        Delete Account
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-red-200">Type "DELETE" to confirm:</p>
                        <input
                          type="text"
                          value={deleteConfirmText}
                          onChange={(e) => setDeleteConfirmText(e.target.value)}
                          className="block w-full rounded-md border-0 bg-white/5 py-2 px-3 text-white ring-1 ring-inset ring-red-500/50 focus:ring-2 focus:ring-inset focus:ring-red-500"
                          placeholder="DELETE"
                        />
                        <div className="flex gap-3">
                          <button
                            onClick={handleDeleteAccount}
                            disabled={isLoading || deleteConfirmText !== 'DELETE'}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-400 disabled:bg-red-500/50 transition-colors text-sm"
                          >
                            {isLoading ? 'Deleting...' : 'Confirm Delete'}
                          </button>
                          <button
                            onClick={() => {
                              setShowDeleteConfirm(false);
                              setDeleteConfirmText('');
                            }}
                            className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
            </div>
         </div>
      </main>
    </>
  );
};
