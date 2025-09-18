import React, { useState, useEffect } from 'react';
import type { User } from '../types';
import * as db from '../services/db';
import { Header } from './Header';
import { TrashIcon } from './icons/TrashIcon';
import { UserIcon } from './icons/UserIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { AdminPanelPageTitle } from './PageTitle';

interface AdminPanelProps {
  onBackToApp: () => void;
  currentUser: User;
  onLogout: () => void;
}

type UserWithCount = User & { articleCount: number };

export const AdminPanel: React.FC<AdminPanelProps> = ({ onBackToApp, currentUser, onLogout }) => {
  const [users, setUsers] = useState<UserWithCount[]>([]);

  useEffect(() => {
    setUsers(db.getUsers());
  }, []);

  const refreshUsers = () => {
    setUsers(db.getUsers());
  };

  const handleDeleteUser = (userId: string, username: string) => {
    if (window.confirm(`Are you sure you want to delete user "${username}" and all their articles? This action cannot be undone.`)) {
      db.deleteUser(userId);
      refreshUsers();
    }
  };
  
  const handleRoleChange = (userId: string, newRole: 'admin' | 'user') => {
      if (window.confirm(`Are you sure you want to change this user's role to "${newRole}"?`)) {
        try {
            db.changeUserRole(userId, newRole);
            refreshUsers();
        } catch (error: any) {
            alert(`Failed to change role: ${error.message}`);
        }
      }
  };

  return (
    <>
      <AdminPanelPageTitle />
      <header className="py-8 text-center px-4">
        <div className="flex justify-between items-center w-full max-w-7xl mx-auto">
          <div className="text-left">
            <button onClick={onBackToApp} className="px-4 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-white/10 transition-colors">
              &larr; Back to App
            </button>
          </div>
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Admin Panel
            </h1>
          </div>
          <div className="text-right">
             <div className="flex items-center gap-2">
               <span className="text-slate-400">
                  Admin: <span className="font-bold text-slate-200">{currentUser.username}</span>
                </span>
              <button onClick={onLogout} className="px-4 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-red-500/20 hover:text-red-300 transition-colors">Logout</button>
            </div>
          </div>
        </div>
        <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
          Manage user accounts for the application.
        </p>
      </header>
      <main className="container mx-auto px-4 py-8 w-full flex-1 overflow-y-auto">
         <div className="max-w-4xl mx-auto bg-white/5 p-6 sm:p-8 rounded-2xl shadow-lg backdrop-blur-xl border border-white/10 animate-fade-in-up">
            <h2 className="text-2xl font-bold text-slate-100 mb-6">User Management</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="p-4 text-slate-400 font-semibold">User</th>
                    <th className="p-4 text-slate-400 font-semibold">Role</th>
                    <th className="p-4 text-slate-400 font-semibold">Articles</th>
                    <th className="p-4 text-slate-400 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                    {users.filter(u => u.id !== currentUser.id).map(user => (
                        <tr key={user.id}>
                            <td className="p-4">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-slate-700 rounded-full">
                                        <UserIcon className="h-6 w-6 text-slate-300" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-200">{user.username}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="p-4">
                                <div className="relative">
                                    <select 
                                        value={user.role} 
                                        onChange={(e) => handleRoleChange(user.id, e.target.value as 'admin' | 'user')}
                                        className="appearance-none w-full bg-slate-700/80 border border-slate-600 text-slate-200 rounded-md py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                                       <ChevronDownIcon className="h-4 w-4" />
                                    </div>
                                </div>
                            </td>
                            <td className="p-4 text-slate-300">{user.articleCount}</td>
                            <td className="p-4 text-right">
                                <button 
                                    onClick={() => handleDeleteUser(user.id, user.username)}
                                    className="p-2 rounded-full text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                                    aria-label={`Delete user ${user.username}`}
                                >
                                    <TrashIcon className="h-5 w-5" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
              </table>
               {users.filter(u => u.id !== currentUser.id).length === 0 && (
                    <p className="py-8 text-center text-slate-500">No other users have registered yet.</p>
                )}
            </div>
         </div>
      </main>
    </>
  );
};
