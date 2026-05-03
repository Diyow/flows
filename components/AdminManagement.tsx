'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAdmins, AdminData } from '@/hooks/useAdmins';
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
    Crown
} from 'lucide-react';

interface AdminManagementProps {
    onLogEvent?: (message: string, type: 'info' | 'alert') => Promise<void>;
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

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setInviteLoading(true);
        setInviteSuccess('');
        clearError();

        try {
            await inviteAdmin(inviteEmail, invitePassword);
            setInviteSuccess(`Successfully invited ${inviteEmail}`);
            setInviteEmail('');
            setInvitePassword('');
            setShowInviteForm(false);
            await onLogEvent?.(`Admin invited: ${inviteEmail}`, 'info');

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
            await onLogEvent?.(`Admin removed: ${adminToRemove?.email ?? adminId}`, 'alert');
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
            await onLogEvent?.(`Admin ${action}: ${targetAdmin?.email ?? adminId}`, 'info');
        } catch {
            // Error is handled by the hook
        } finally {
            setActionLoading(null);
        }
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
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <Shield className="w-3 h-3" />
                Admin
            </span>
        );
    };

    const getStatusBadge = (admin: AdminData) => {
        if (admin.disabled) {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/15 text-red-400 border border-red-500/30">
                    <Ban className="w-3 h-3" />
                    Disabled
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <CheckCircle className="w-3 h-3" />
                Active
            </span>
        );
    };

    if (loading) {
        return (
            <div className="p-6 rounded-xl bg-gray-800/50 border border-gray-700">
                <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                    <span className="text-gray-400">Loading admin data...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 rounded-xl bg-gray-800/50 border border-gray-700">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-cyan-500/20">
                        <Users className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">Manage Admins</h3>
                        <p className="text-xs text-gray-500">{admins.length} admin{admins.length !== 1 ? 's' : ''} registered</p>
                    </div>
                </div>

                <button
                    onClick={() => {
                        setShowInviteForm(!showInviteForm);
                        clearError();
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-sm font-medium hover:bg-cyan-500/30 transition-all duration-200"
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
                        <UserPlus className="w-4 h-4 text-cyan-400" />
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
                                className="w-full pl-10 pr-3 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
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
                                className="w-full pl-10 pr-3 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
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
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

            {/* Admin List */}
            <div className="space-y-2">
                {admins.map((admin) => {
                    const isCurrentUser = admin.email === user?.email;
                    const isBeingDeleted = confirmDelete === admin.id;

                    return (
                        <div
                            key={admin.id}
                            className={`p-4 rounded-lg border transition-all duration-200 ${
                                admin.disabled
                                    ? 'bg-gray-900/30 border-gray-800 opacity-60'
                                    : isCurrentUser
                                    ? 'bg-cyan-500/5 border-cyan-500/20'
                                    : 'bg-gray-900/50 border-gray-700 hover:border-gray-600'
                            }`}
                        >
                            {/* Delete Confirmation */}
                            {isBeingDeleted ? (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5 text-red-400" />
                                        <p className="text-red-400 text-sm">
                                            Remove <strong>{admin.email}</strong>? This cannot be undone.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
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
                                        <button
                                            onClick={() => setConfirmDelete(null)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-700 text-gray-300 text-xs font-medium hover:bg-gray-600 transition-colors"
                                        >
                                            <X className="w-3 h-3" />
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between flex-wrap gap-3">
                                    {/* Admin Info */}
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                                            admin.role === 'super_admin'
                                                ? 'bg-amber-500/20'
                                                : 'bg-cyan-500/20'
                                        }`}>
                                            {admin.role === 'super_admin' ? (
                                                <ShieldCheck className="w-4 h-4 text-amber-400" />
                                            ) : (
                                                <Shield className="w-4 h-4 text-cyan-400" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-sm font-medium text-white truncate">
                                                    {admin.email}
                                                </p>
                                                {isCurrentUser && (
                                                    <span className="text-[10px] font-medium text-gray-400 bg-gray-700 px-1.5 py-0.5 rounded">
                                                        YOU
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                {getRoleBadge(admin)}
                                                {getStatusBadge(admin)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Admin Meta + Actions */}
                                    <div className="flex items-center gap-3">
                                        {/* Meta info */}
                                        <div className="text-right hidden sm:block">
                                            <p className="text-[11px] text-gray-500">
                                                Added {admin.createdAt.toLocaleDateString()}
                                            </p>
                                            <p className="text-[11px] text-gray-500">
                                                by {admin.createdBy}
                                            </p>
                                        </div>

                                        {/* Actions (super_admin only, not for self) */}
                                        {isSuperAdmin && !isCurrentUser && (
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    onClick={() => handleToggleDisabled(admin.id, admin.disabled)}
                                                    disabled={actionLoading === admin.id}
                                                    title={admin.disabled ? 'Enable admin' : 'Disable admin'}
                                                    className={`p-2 rounded-lg border transition-colors disabled:opacity-50 ${
                                                        admin.disabled
                                                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                                                            : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
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
                                                    className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
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

            {/* Permission info */}
            {!isSuperAdmin && (
                <div className="mt-4 p-3 rounded-lg bg-gray-900/30 border border-gray-700">
                    <p className="text-gray-500 text-xs flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5" />
                        Only Super Admins can disable or remove other admins
                    </p>
                </div>
            )}
        </div>
    );
}
