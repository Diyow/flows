'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAdmins, AdminData } from '@/hooks/useAdmins';
import { sendPasswordResetEmail, getAuth } from 'firebase/auth';
import { initializeFirebase } from '@/lib/firebase';
import {
    Users,
    UserPlus,
    Shield,
    ShieldCheck,
    Trash2,
    Ban,
    CheckCircle,
    X,
    AlertTriangle,
    Mail,
    Lock,
    Loader2,
    Crown,
    KeyRound,
    Clock
} from 'lucide-react';

interface AdminManagementProps {
    onLogEvent?: (message: string, type: 'info' | 'warning' | 'danger') => Promise<void>;
}

export function AdminManagement({ onLogEvent }: AdminManagementProps) {
    const { user, isSuperAdmin } = useAuth();
    const {
        admins,
        loading,
        error,
        inviteAdmin,
        removeAdmin,
        toggleAdminDisabled,
        clearError,
    } = useAdmins(user?.email);

    const [showInviteForm, setShowInviteForm] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [invitePassword, setInvitePassword] = useState('');
    const [inviteLoading, setInviteLoading] = useState(false);
    const [inviteSuccess, setInviteSuccess] = useState('');
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [resetLoading, setResetLoading] = useState(false);
    const [resetSuccess, setResetSuccess] = useState('');

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setInviteLoading(true);
        setInviteSuccess('');
        clearError();

        try {
            const invited = inviteEmail;
            await inviteAdmin(inviteEmail, invitePassword);
            setInviteSuccess(`Successfully invited ${invited}`);
            setInviteEmail('');
            setInvitePassword('');
            setShowInviteForm(false);
            await onLogEvent?.(`${user?.email} invited new admin: ${invited}`, 'info');

            // Clear success message after 4 seconds
            setTimeout(() => setInviteSuccess(''), 4000);
        } catch {
            // Error is handled by the hook
        } finally {
            setInviteLoading(false);
        }
    };

    const handleRemove = async (adminId: string) => {
        const adminToRemove = admins.find(a => a.id === adminId);
        setActionLoading(adminId);
        try {
            await removeAdmin(adminId);
            setConfirmDelete(null);
            await onLogEvent?.(`${user?.email} removed admin: ${adminToRemove?.email ?? adminId}`, 'danger');
        } catch {
            // Error is handled by the hook
        } finally {
            setActionLoading(null);
        }
    };

    const handleToggleDisabled = async (adminId: string, currentlyDisabled: boolean) => {
        const targetAdmin = admins.find(a => a.id === adminId);
        setActionLoading(adminId);
        try {
            await toggleAdminDisabled(adminId, !currentlyDisabled);
            const action = currentlyDisabled ? 'enabled' : 'disabled';
            await onLogEvent?.(`${user?.email} ${action} admin: ${targetAdmin?.email ?? adminId}`, 'info');
        } catch {
            // Error is handled by the hook
        } finally {
            setActionLoading(null);
        }
    };

    const handleSendPasswordReset = async () => {
        if (!user?.email) return;
        setResetLoading(true);
        setResetSuccess('');
        clearError();

        try {
            const { auth } = initializeFirebase();
            if (!auth) throw new Error('Firebase Auth not configured');

            await sendPasswordResetEmail(auth, user.email);

            setResetSuccess(`Password reset email sent to your address (${user.email})`);
            await onLogEvent?.(`${user.email} requested a password reset`, 'info');
            setTimeout(() => setResetSuccess(''), 5000);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to send reset email';
            clearError();
            setResetSuccess('');
            console.error('Password reset error:', message);
        } finally {
            setResetLoading(false);
        }
    };

    const formatLastAccess = (date: Date) => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const getRoleBadge = (admin: AdminData) => {
        if (admin.role === 'super_admin') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <Crown className="w-3 h-3" />
                    Super Admin
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <Shield className="w-3 h-3" />
                Admin
            </span>
        );
    };

    const getStatusBadge = (admin: AdminData) => {
        if (admin.disabled) {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-red-500/15 text-red-400 border border-red-500/30">
                    <Ban className="w-3 h-3" />
                    Disabled
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <CheckCircle className="w-3 h-3" />
                Active
            </span>
        );
    };

    if (loading) {
        return (
            <div className="p-6 rounded-xl bg-gray-800/50 border border-gray-700">
                <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                    <span className="text-gray-400">Loading admin data...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 rounded-xl bg-gray-800/50 border border-gray-700 h-full flex flex-col">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Users className="w-6 h-6 text-blue-400" />
                    <div>
                        <h3 className="text-lg font-semibold text-white">Manage Admins</h3>
                        <p className="text-[11px] text-gray-500">{admins.length} admin{admins.length !== 1 ? 's' : ''} registered</p>
                    </div>
                </div>

                <button
                    onClick={() => {
                        setShowInviteForm(!showInviteForm);
                        clearError();
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-500/40 text-blue-400 text-sm font-medium hover:bg-blue-500/10 transition-all duration-200"
                >
                    {showInviteForm ? (
                        <>
                            <X className="w-4 h-4" />
                            Cancel
                        </>
                    ) : (
                        <>
                            <UserPlus className="w-4 h-4" />
                            Invite Admin
                        </>
                    )}
                </button>
            </div>

            {/* Success Message */}
            {inviteSuccess && (
                <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <p className="text-emerald-400 text-sm">{inviteSuccess}</p>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>
                    <button onClick={clearError} className="text-red-400 hover:text-red-300">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Invite Form */}
            {showInviteForm && (
                <form onSubmit={handleInvite} className="mb-6 p-4 rounded-lg bg-gray-900/50 border border-gray-700 space-y-4">
                    <h4 className="text-sm font-medium text-white flex items-center gap-2">
                        <UserPlus className="w-4 h-4 text-blue-400" />
                        Invite New Admin
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="w-4 h-4 text-gray-500" />
                            </div>
                            <input
                                type="email"
                                placeholder="Email address"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                required
                                className="w-full pl-10 pr-3 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                            />
                        </div>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="w-4 h-4 text-gray-500" />
                            </div>
                            <input
                                type="password"
                                placeholder="Temporary password"
                                value={invitePassword}
                                onChange={(e) => setInvitePassword(e.target.value)}
                                required
                                minLength={6}
                                className="w-full pl-10 pr-3 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <p className="text-gray-500 text-xs">
                            Share the credentials with the new admin securely
                        </p>
                        <button
                            type="submit"
                            disabled={inviteLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 text-sm font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {inviteLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Inviting...
                                </>
                            ) : (
                                <>
                                    <UserPlus className="w-4 h-4" />
                                    Send Invite
                                </>
                            )}
                        </button>
                    </div>
                </form>
            )}

            {/* Admin List Area */}
            <div className="flex-1 min-h-0 relative mt-2">
                <div className="absolute inset-0 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                {admins.map((admin) => {
                    const isCurrentUser = admin.email === user?.email;
                    const isBeingDeleted = confirmDelete === admin.id;

                    return (
                        <div
                            key={admin.id}
                            className={`p-5 rounded-xl border transition-all duration-300 group ${admin.disabled
                                ? 'bg-gray-900/30 border-gray-800 opacity-60'
                                : isCurrentUser
                                    ? 'bg-blue-500/5 border-blue-500/20'
                                    : 'bg-gray-900/50 border-gray-700 hover:border-gray-600 hover:bg-gray-900/80'
                                }`}
                        >
                            {/* Delete Confirmation */}
                            {isBeingDeleted ? (
                                <div className="flex items-center justify-between py-1">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-red-500/20">
                                            <AlertTriangle className="w-5 h-5 text-red-400" />
                                        </div>
                                        <div>
                                            <p className="text-red-400 text-sm font-medium">
                                                Remove admin?
                                            </p>
                                            <p className="text-gray-500 text-xs truncate max-w-[200px]">
                                                {admin.email}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setConfirmDelete(null)}
                                            className="px-3 py-1.5 rounded-lg bg-gray-700 text-gray-300 text-xs font-medium hover:bg-gray-600 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => handleRemove(admin.id)}
                                            disabled={actionLoading === admin.id}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-medium hover:bg-red-500/30 transition-colors disabled:opacity-50"
                                        >
                                            {actionLoading === admin.id ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-3 h-3" />
                                            )}
                                            Confirm
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between gap-4">
                                    {/* Left: Admin Info */}
                                    <div className="flex items-center gap-4 min-w-0">
                                         <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-105 ${admin.role === 'super_admin'
                                            ? 'bg-amber-500/10 border border-amber-500/20'
                                            : 'bg-blue-500/10 border border-blue-500/20'
                                            }`}>
                                            {admin.role === 'super_admin' ? (
                                                <ShieldCheck className="w-5 h-5 text-amber-400" />
                                            ) : (
                                                <Shield className="w-5 h-5 text-blue-400" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-semibold text-white truncate">
                                                    {admin.email}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Meta + Actions */}
                                    <div className="flex items-center gap-5">
                                        {/* Meta info - Hidden on very small mobile */}
                                        <div className="text-right hidden sm:block">
                                            <div className="flex flex-col items-end gap-0.5">
                                                <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-medium">
                                                    <Clock className="w-3 h-3" />
                                                    <span>{formatLastAccess(admin.lastAccess)}</span>
                                                </div>
                                                <p className="text-[10px] text-gray-600">
                                                    Added {admin.createdAt.toLocaleDateString()}
                                                </p>
                                                <p className="text-[10px] text-gray-600 truncate max-w-[100px]">
                                                    by {admin.createdBy === 'System (existing account)' ? 'System' : admin.createdBy.split('@')[0]}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Actions (super_admin only, not for self) */}
                                        {isSuperAdmin && !isCurrentUser && (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleToggleDisabled(admin.id, admin.disabled)}
                                                    disabled={actionLoading === admin.id}
                                                    title={admin.disabled ? 'Enable admin' : 'Disable admin'}
                                                    className={`p-2.5 rounded-lg border transition-all duration-200 disabled:opacity-50 ${admin.disabled
                                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                                                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-white'
                                                        }`}
                                                >
                                                    {actionLoading === admin.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : admin.disabled ? (
                                                        <CheckCircle className="w-4 h-4" />
                                                    ) : (
                                                        <Ban className="w-4 h-4" />
                                                    )}
                                                </button>

                                                <button
                                                    onClick={() => setConfirmDelete(admin.id)}
                                                    disabled={actionLoading === admin.id}
                                                    title="Remove admin"
                                                    className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all duration-200 disabled:opacity-50"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}

                {admins.length === 0 && (
                    <div className="text-center py-8">
                        <Users className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">No admins found</p>
                    </div>
                )}
            </div>
        </div>

            {/* Bottom Section: Password Reset & Info */}
            <div className="mt-auto pt-6 space-y-4">
                {user?.email && admins.length > 0 && (
                    <div className="p-5 rounded-xl bg-gray-900/30 border border-gray-700/50">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <p className="text-gray-500 text-[11px] leading-relaxed">
                                    Send password reset link to <strong>{user.email}</strong>
                                </p>
                            </div>

                            <button
                                onClick={handleSendPasswordReset}
                                disabled={resetLoading}
                                className={`min-w-[160px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${resetSuccess
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30'
                                    } disabled:opacity-50`}
                            >
                                {resetLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : resetSuccess ? (
                                    <CheckCircle className="w-4 h-4" />
                                ) : (
                                    <KeyRound className="w-4 h-4" />
                                )}
                                {resetLoading ? 'Sending...' : resetSuccess ? 'Email Sent!' : 'Reset Password'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Permission info */}
                {!isSuperAdmin && (
                    <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-3">
                        <div className="p-1.5 rounded-lg bg-amber-500/10">
                            <Shield className="w-4 h-4 text-amber-500" />
                        </div>
                        <p className="text-gray-500 text-xs leading-relaxed">
                            <span className="text-amber-500/80 font-medium">Standard Admin Access:</span> You can view team members but only Super Admins can manage account status or removals.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
