'use client';

import { useState } from 'react';
import { Users, UserPlus, UserX, UserCheck, Clock, Mail, X, AlertCircle } from 'lucide-react';
import { useAdminUsers, AdminUser } from '@/hooks/useAdminUsers';
import { useAuth } from '@/context/AuthContext';

export function AdminUsers() {
    const { user } = useAuth();
    const { admins, loading, error, addAdmin, toggleAdminStatus } = useAdminUsers();
    const [showAddModal, setShowAddModal] = useState(false);
    const [newEmail, setNewEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [addError, setAddError] = useState('');
    const [adding, setAdding] = useState(false);
    const [toggleError, setToggleError] = useState('');

    const handleAddAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        setAddError('');
        setAdding(true);

        const result = await addAdmin(newEmail, newPassword, user?.email || 'Unknown');

        if (result.success) {
            setShowAddModal(false);
            setNewEmail('');
            setNewPassword('');
        } else {
            setAddError(result.error || 'Failed to add admin');
        }

        setAdding(false);
    };

    const handleToggleStatus = async (admin: AdminUser) => {
        setToggleError('');

        if (!user) return;

        const result = await toggleAdminStatus(admin.uid, user.uid);

        if (!result.success) {
            setToggleError(result.error || 'Failed to update status');
            setTimeout(() => setToggleError(''), 3000);
        }
    };

    const formatDate = (date: Date | null) => {
        if (!date) return 'Never';
        return new Intl.DateTimeFormat('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
        }).format(date);
    };

    if (loading) {
        return (
            <div className="p-6 rounded-xl bg-gray-800/50 border border-gray-700 animate-pulse">
                <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 bg-gray-700 rounded"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="p-6 rounded-xl bg-gray-800/50 border border-gray-700">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-cyan-400" />
                        <h3 className="text-lg font-semibold text-white">Admin Users</h3>
                        <span className="px-2 py-0.5 text-xs bg-gray-700 text-gray-300 rounded-full">
                            {admins.length}
                        </span>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors"
                    >
                        <UserPlus className="w-4 h-4" />
                        Add Admin
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {toggleError && (
                    <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {toggleError}
                    </div>
                )}

                {admins.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No admin users found</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {admins.map((admin) => (
                            <div
                                key={admin.uid}
                                className={`p-4 rounded-lg border ${admin.disabled
                                        ? 'bg-gray-900/50 border-gray-700 opacity-60'
                                        : 'bg-gray-900/50 border-gray-700'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Mail className="w-4 h-4 text-gray-500" />
                                            <span className="text-white font-medium">{admin.email}</span>
                                            {admin.uid === user?.uid && (
                                                <span className="px-2 py-0.5 text-xs bg-cyan-500/20 text-cyan-400 rounded-full">
                                                    You
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                Last access: {formatDate(admin.lastAccess)}
                                            </span>
                                            <span>Created: {formatDate(admin.createdAt)}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {/* Status Badge */}
                                        <span
                                            className={`px-3 py-1 text-xs rounded-full ${admin.disabled
                                                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                }`}
                                        >
                                            {admin.disabled ? 'Disabled' : 'Active'}
                                        </span>

                                        {/* Toggle Button (not for self) */}
                                        {admin.uid !== user?.uid && (
                                            <button
                                                onClick={() => handleToggleStatus(admin)}
                                                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${admin.disabled
                                                        ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                                        : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                                    }`}
                                                title={admin.disabled ? 'Enable this admin' : 'Disable this admin'}
                                            >
                                                {admin.disabled ? (
                                                    <>
                                                        <UserCheck className="w-4 h-4" />
                                                        Enable
                                                    </>
                                                ) : (
                                                    <>
                                                        <UserX className="w-4 h-4" />
                                                        Disable
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <p className="mt-4 text-xs text-gray-500 text-center">
                    Disabled admins cannot access the admin dashboard
                </p>
            </div>

            {/* Add Admin Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-md p-6 rounded-2xl bg-gray-800 border border-gray-700 shadow-xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-white">Add New Admin</h3>
                            <button
                                onClick={() => {
                                    setShowAddModal(false);
                                    setAddError('');
                                    setNewEmail('');
                                    setNewPassword('');
                                }}
                                className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAddAdmin} className="space-y-4">
                            {addError && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    {addError}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    placeholder="newadmin@example.com"
                                    required
                                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Minimum 6 characters"
                                    required
                                    minLength={6}
                                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddModal(false);
                                        setAddError('');
                                    }}
                                    className="flex-1 px-4 py-2 rounded-lg border border-gray-600 text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={adding}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors disabled:opacity-50"
                                >
                                    {adding ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus className="w-4 h-4" />
                                            Create Admin
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
