import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { apiService } from '../services/apiService';
import { X, RefreshCw } from 'lucide-react';

interface ProfilePageProps {
    user: User;
    onClose: () => void;
    showNotification: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
    setUser: (user: User) => void;
    viewingUserId?: string;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ user, onClose, showNotification, setUser, viewingUserId }) => {
    const [profileData, setProfileData] = useState<any>(null);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'settings'>('overview');
    const [searchQuery, setSearchQuery] = useState('');
    const [editingName, setEditingName] = useState(false);
    const [newName, setNewName] = useState(user.name);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [settingsLoading, setSettingsLoading] = useState(false);
    const [viewingUser, setViewingUser] = useState<any>(null);
    const [shareUrl, setShareUrl] = useState('');
    const [shareButtonCopied, setShareButtonCopied] = useState(false);
    const [viewedUserShareCopied, setViewedUserShareCopied] = useState(false);

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                const profileRes = await apiService.getProfile(user.id);
                setProfileData(profileRes);
                const leaderboardRes = await apiService.getLeaderboard(50);
                setLeaderboard(leaderboardRes);
            } catch (error) {
                console.error('Error fetching profile data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfileData();
    }, [user.id, user.problemsSolvedEasy, user.problemsSolvedMedium, user.problemsSolvedHard]);

    const handleUpdateProfile = async () => {
        if (newName.trim() === user.name && !newPassword) {
            setEditingName(false);
            return;
        }

        if (newPassword && newPassword !== confirmPassword) {
            showNotification('Passwords do not match', 'error');
            return;
        }

        setSettingsLoading(true);
        try {
            await apiService.updateProfile(newName.trim(), newPassword || undefined);
            
            setUser({ ...user, name: newName.trim() });
            setNewPassword('');
            setConfirmPassword('');
            setEditingName(false);
            showNotification('Profile updated successfully', 'success');
        } catch (error) {
            console.error('Error updating profile:', error);
            showNotification('Failed to update profile', 'error');
        } finally {
            setSettingsLoading(false);
        }
    };

    const handleViewUserProfile = async (userId: string, userName: string) => {
        try {
            // Fetch public profile using username (no share code needed for viewing from leaderboard)
            const userProfileRes = await apiService.getPublicProfile(userName);
            console.log('[ProfilePage] Fetched user profile:', userProfileRes);
            setViewingUser({ ...userProfileRes, id: userId, name: userName });
            
            // Use the share code from the response to generate the shareable link
            const shareCode = userProfileRes.shareCode || '';
            console.log('[ProfilePage] Share code:', shareCode);
            const url = `${window.location.origin}/profile/${encodeURIComponent(userName)}/${shareCode}`;
            console.log('[ProfilePage] Generated URL:', url);
            setShareUrl(url);
        } catch (error) {
            console.error('Error fetching user profile:', error);
            showNotification('Failed to load user profile', 'error');
        }
    };

    const copyShareUrl = () => {
        navigator.clipboard.writeText(shareUrl);
        setViewedUserShareCopied(true);
        showNotification('Profile link copied to clipboard', 'success');
        setTimeout(() => setViewedUserShareCopied(false), 2000);
    };

    const handleRefreshProfile = async () => {
        setLoading(true);
        try {
            const profileRes = await apiService.getProfile(user.id);
            setProfileData(profileRes);
            const leaderboardRes = await apiService.getLeaderboard(50);
            setLeaderboard(leaderboardRes);
            showNotification('Profile refreshed', 'success');
        } catch (error) {
            console.error('Error refreshing profile:', error);
            showNotification('Failed to refresh profile', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black text-white flex items-center justify-center z-[300]">
                <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const data = profileData || {
        impactScore: (user.problemsSolvedEasy * 10) + (user.problemsSolvedMedium * 30) + (user.problemsSolvedHard * 60),
        totalProblemsSolved: user.problemsSolvedEasy + user.problemsSolvedMedium + user.problemsSolvedHard,
        problemsPerDay: {},
        leaderboardRank: 0,
        leaderboardPercentile: 0
    };

    const today = new Date();
    const yearStart = new Date(today.getFullYear(), 0, 1);
    const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    const filteredLeaderboard = (leaderboard || []).filter(entry =>
        entry?.name?.toLowerCase?.().includes(searchQuery.toLowerCase())
    );

    // Generate all weeks from Jan 1 to today
    const generateWeeks = () => {
        const weeks: (number | null)[][] = [];
        let currentWeek: (number | null)[] = [];
        
        // Add empty slots for days before Jan 1
        const startDay = yearStart.getDay();
        for (let i = 0; i < startDay; i++) {
            currentWeek.push(null);
        }
        
        // Add all days from Jan 1 to today
        const currentDate = new Date(yearStart);
        while (currentDate <= today) {
            currentWeek.push(currentDate.getDate());
            
            if (currentWeek.length === 7) {
                weeks.push(currentWeek);
                currentWeek = [];
            }
            
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // Add remaining days if week is incomplete
        if (currentWeek.length > 0) {
            weeks.push(currentWeek);
        }
        
        return weeks;
    };

    const weeks = generateWeeks();

    return (
        <div className="fixed inset-0 bg-black text-white overflow-hidden z-[300]">
            <div className="h-full overflow-y-auto">
                <div className="min-h-screen p-6 flex items-center justify-center">
                    <div className="w-full max-w-5xl">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-800">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-violet-600 to-violet-900 flex items-center justify-center">
                                    <span className="text-lg font-bold">{user.name.charAt(0).toUpperCase()}</span>
                                </div>
                                <div>
                                    <h1 className="text-lg font-bold text-white">{user.name}</h1>
                                    <p className="text-xs text-zinc-400">{user.rank}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={handleRefreshProfile} className="text-zinc-500 hover:text-white p-1 transition-colors" title="Refresh profile">
                                    <RefreshCw className="w-5 h-5" />
                                </button>
                                <button onClick={onClose} className="text-zinc-500 hover:text-white p-1">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Tab Navigation */}
                        <div className="flex gap-6 mb-8 border-b border-zinc-800">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`pb-2 text-sm font-semibold transition-all ${
                                    activeTab === 'overview'
                                        ? 'text-violet-400 border-b-2 border-violet-500'
                                        : 'text-zinc-400 hover:text-white'
                                }`}
                            >
                                Overview
                            </button>
                            <button
                                onClick={() => setActiveTab('settings')}
                                className={`pb-2 text-sm font-semibold transition-all ${
                                    activeTab === 'settings'
                                        ? 'text-violet-400 border-b-2 border-violet-500'
                                        : 'text-zinc-400 hover:text-white'
                                }`}
                            >
                                Settings
                            </button>
                        </div>

                        {/* Overview Tab */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                {/* Quick Stats - Centered */}
                                <div className="flex justify-center">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-2xl">
                                        <div className="bg-zinc-900/40 border border-zinc-800 rounded p-3">
                                            <p className="text-xs text-zinc-500 font-semibold mb-1">Impact</p>
                                            <p className="text-xl font-bold text-violet-400">{data.impactScore}</p>
                                        </div>
                                        <div className="bg-zinc-900/40 border border-zinc-800 rounded p-3">
                                            <p className="text-xs text-zinc-500 font-semibold mb-1">Solved</p>
                                            <p className="text-xl font-bold text-green-400">{data.totalProblemsSolved}</p>
                                        </div>
                                        <div className="bg-zinc-900/40 border border-zinc-800 rounded p-3">
                                            <p className="text-xs text-zinc-500 font-semibold mb-1">Streak</p>
                                            <p className="text-xl font-bold text-orange-400">{user.streak}</p>
                                        </div>
                                        <div className="bg-zinc-900/40 border border-zinc-800 rounded p-3">
                                            <p className="text-xs text-zinc-500 font-semibold mb-1">Rank</p>
                                            <p className="text-xl font-bold text-blue-400">#{data.leaderboardRank}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Leaderboard - Left */}
                                    <div className="bg-zinc-900/20 border border-zinc-800 rounded p-4 flex flex-col">
                                        <h3 className="text-sm font-bold text-white mb-2">Leaderboard</h3>
                                        
                                        <input
                                            type="text"
                                            placeholder="Search..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full bg-zinc-800/30 border border-zinc-700 rounded px-2 py-1.5 text-xs text-white placeholder-zinc-600 mb-2 focus:outline-none focus:border-violet-500"
                                        />

                                        <div className="p-2 rounded bg-violet-600/20 border border-violet-500/50 mb-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className="text-xs">👤</span>
                                                    <span className="text-xs font-semibold text-white truncate">{user.name}</span>
                                                </div>
                                                <span className="text-xs font-bold text-violet-400 flex-shrink-0">{data.impactScore}</span>
                                            </div>
                                        </div>

                                        <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
                                            {filteredLeaderboard.slice(0, 15).map((entry, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleViewUserProfile(entry._id || entry.id, entry.name)}
                                                    className="w-full p-1.5 rounded text-xs bg-zinc-900/20 border border-zinc-800 flex items-center justify-between hover:border-violet-500 hover:bg-zinc-900/40 transition-all text-left"
                                                >
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                        <span className="text-zinc-500 font-semibold flex-shrink-0">#{entry.rank}</span>
                                                        <span className="text-zinc-300 truncate">{entry.name}</span>
                                                    </div>
                                                    <span className="text-violet-400 font-semibold flex-shrink-0">{entry.impactScore}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Calendar - Right */}
                                    <div className="lg:col-span-2 bg-zinc-900/20 border border-zinc-800 rounded p-4">
                                        <h3 className="text-sm font-bold text-white mb-2">Activity {today.getFullYear()}</h3>
                                        
                                        <div className="overflow-x-auto">
                                            <div className="inline-block">
                                                {/* Day headers row */}
                                                <div className="flex gap-0 mb-0.5">
                                                    {dayNames.map((day, idx) => (
                                                        <div key={`header-${idx}`} className="text-center text-xs text-zinc-500 font-semibold w-3 h-4 flex items-center justify-center">
                                                            {day}
                                                        </div>
                                                    ))}
                                                </div>
                                                
                                                {/* Calendar grid */}
                                                <div className="flex gap-0">
                                                    {weeks.map((week, weekIdx) => (
                                                        <div key={`week-${weekIdx}`} className="flex flex-col gap-0">
                                                            {week.map((dayNum, dayIdx) => {
                                                                if (dayNum === null) {
                                                                    return <div key={`empty-${weekIdx}-${dayIdx}`} className="w-3 h-3"></div>;
                                                                }
                                                                
                                                                const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                                                                const problemsCount = data.problemsPerDay[dateStr] || 0;
                                                                const isToday = dayNum === today.getDate() && weekIdx === weeks.length - 1;
                                                                
                                                                let bgColor = 'bg-zinc-900/30';
                                                                if (problemsCount > 0) {
                                                                    if (problemsCount === 1) bgColor = 'bg-violet-900/50';
                                                                    else if (problemsCount === 2) bgColor = 'bg-violet-800/60';
                                                                    else if (problemsCount === 3) bgColor = 'bg-violet-700/70';
                                                                    else bgColor = 'bg-violet-600/80';
                                                                }
                                                                
                                                                return (
                                                                    <div
                                                                        key={`${weekIdx}-${dayIdx}`}
                                                                        className={`w-3 h-3 rounded-sm border border-zinc-800 hover:border-violet-500 transition-all cursor-pointer ${bgColor} ${
                                                                            isToday ? 'ring-1 ring-violet-400' : ''
                                                                        }`}
                                                                        title={`${dayNum} - ${problemsCount} problem${problemsCount !== 1 ? 's' : ''}`}
                                                                    >
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-2 pt-2 border-t border-zinc-800 flex items-center gap-1 text-xs">
                                            <span className="text-zinc-500">Less</span>
                                            <div className="flex gap-0.5">
                                                <div className="w-2 h-2 rounded-sm bg-zinc-900/30 border border-zinc-800"></div>
                                                <div className="w-2 h-2 rounded-sm bg-violet-900/50 border border-zinc-800"></div>
                                                <div className="w-2 h-2 rounded-sm bg-violet-800/60 border border-zinc-800"></div>
                                                <div className="w-2 h-2 rounded-sm bg-violet-700/70 border border-zinc-800"></div>
                                                <div className="w-2 h-2 rounded-sm bg-violet-600/80 border border-zinc-800"></div>
                                            </div>
                                            <span className="text-zinc-500">More</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Settings Tab */}
                        {activeTab === 'settings' && (
                            <div className="space-y-6">
                                {/* Quick Stats - Centered */}
                                <div className="flex justify-center">
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 w-full max-w-3xl">
                                        <div className="bg-zinc-900/40 border border-zinc-800 rounded p-3">
                                            <p className="text-xs text-zinc-500 font-semibold mb-1">Impact</p>
                                            <p className="text-xl font-bold text-violet-400">{data.impactScore}</p>
                                        </div>
                                        <div className="bg-zinc-900/40 border border-zinc-800 rounded p-3">
                                            <p className="text-xs text-zinc-500 font-semibold mb-1">Email</p>
                                            <p className="text-xs font-mono text-zinc-300 truncate">{user.email}</p>
                                        </div>
                                        <div className="bg-zinc-900/40 border border-zinc-800 rounded p-3">
                                            <p className="text-xs text-zinc-500 font-semibold mb-1">Rank</p>
                                            <p className="text-sm font-bold text-blue-400">{user.rank}</p>
                                        </div>
                                        <div className="bg-zinc-900/40 border border-zinc-800 rounded p-3">
                                            <p className="text-xs text-zinc-500 font-semibold mb-1">Easy</p>
                                            <p className="text-sm font-bold text-green-400">{user.problemsSolvedEasy}</p>
                                        </div>
                                        <div className="bg-zinc-900/40 border border-zinc-800 rounded p-3">
                                            <p className="text-xs text-zinc-500 font-semibold mb-1">Medium</p>
                                            <p className="text-sm font-bold text-yellow-400">{user.problemsSolvedMedium}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex justify-center">
                                    {/* Profile Settings */}
                                    <div className="bg-zinc-900/20 border border-zinc-800 rounded p-4">
                                        <h3 className="text-sm font-bold text-white mb-3">Profile</h3>
                                        
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-xs font-semibold text-zinc-300 mb-1">Display Name</label>
                                                {editingName ? (
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            value={newName}
                                                            onChange={(e) => setNewName(e.target.value)}
                                                            className="flex-1 bg-zinc-800/30 border border-zinc-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500"
                                                        />
                                                        <button
                                                            onClick={() => handleUpdateProfile()}
                                                            disabled={settingsLoading}
                                                            className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded text-xs font-semibold disabled:opacity-50"
                                                        >
                                                            Save
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setEditingName(false);
                                                                setNewName(user.name);
                                                            }}
                                                            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-xs font-semibold"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-between bg-zinc-800/20 border border-zinc-800 rounded px-2 py-1.5">
                                                        <span className="text-xs text-white">{user.name}</span>
                                                        <button
                                                            onClick={() => setEditingName(true)}
                                                            className="text-violet-400 hover:text-violet-300 text-xs font-semibold"
                                                        >
                                                            Edit
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Security Settings */}
                                    <div className="bg-zinc-900/20 border border-zinc-800 rounded p-4">
                                        <h3 className="text-sm font-bold text-white mb-3">Security</h3>
                                        
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-xs font-semibold text-zinc-300 mb-1">New Password</label>
                                                <input
                                                    type="password"
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    placeholder="Leave blank to keep current"
                                                    className="w-full bg-zinc-800/30 border border-zinc-700 rounded px-2 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-zinc-300 mb-1">Confirm Password</label>
                                                <input
                                                    type="password"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    placeholder="Confirm new password"
                                                    className="w-full bg-zinc-800/30 border border-zinc-700 rounded px-2 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500"
                                                />
                                            </div>

                                            <button
                                                onClick={handleUpdateProfile}
                                                disabled={settingsLoading || (!newPassword && !editingName)}
                                                className="w-full px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                            >
                                                {settingsLoading ? 'Updating...' : 'Update Settings'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Share Profile */}
                                    <div className="bg-zinc-900/20 border border-zinc-800 rounded p-4">
                                        <h3 className="text-sm font-bold text-white mb-3">Share Profile</h3>
                                        
                                        <div className="space-y-3">
                                            <p className="text-xs text-zinc-400">Share your profile with others using a unique link</p>
                                            
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        const shareRes = await apiService.generateShareCode();
                                                        const url = `${window.location.origin}/profile/${encodeURIComponent(user.name)}/${shareRes.shareCode}`;
                                                        navigator.clipboard.writeText(url);
                                                        setShareButtonCopied(true);
                                                        showNotification('Profile link copied to clipboard', 'success');
                                                        setTimeout(() => setShareButtonCopied(false), 2000);
                                                    } catch (error) {
                                                        console.error('Error generating share code:', error);
                                                        showNotification('Failed to generate share link', 'error');
                                                    }
                                                }}
                                                className={`w-full px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                                                    shareButtonCopied
                                                        ? 'bg-green-600 hover:bg-green-500 text-white'
                                                        : 'bg-violet-600 hover:bg-violet-500 text-white'
                                                }`}
                                            >
                                                {shareButtonCopied ? '✓ Copied!' : 'Generate & Copy Link'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Viewed User Profile Modal */}
            {viewingUser && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[400]">
                    <div className="bg-black border border-zinc-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b border-zinc-800 sticky top-0 bg-black">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-600 to-violet-900 flex items-center justify-center">
                                    <span className="text-sm font-bold">{viewingUser.name.charAt(0).toUpperCase()}</span>
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-white">{viewingUser.name}</h2>
                                    <p className="text-xs text-zinc-400">Rank: {viewingUser.rank || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={copyShareUrl}
                                    className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                                        viewedUserShareCopied
                                            ? 'bg-green-600 hover:bg-green-500 text-white'
                                            : 'bg-violet-600 hover:bg-violet-500 text-white'
                                    }`}
                                    title="Copy shareable link"
                                >
                                    {viewedUserShareCopied ? '✓ Copied!' : 'Share'}
                                </button>
                                <button
                                    onClick={() => setViewingUser(null)}
                                    className="p-1.5 text-zinc-500 hover:text-white"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-4 space-y-4">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="bg-zinc-900/40 border border-zinc-800 rounded p-3">
                                    <p className="text-xs text-zinc-500 font-semibold mb-1">Impact</p>
                                    <p className="text-lg font-bold text-violet-400">{viewingUser.impactScore || 0}</p>
                                </div>
                                <div className="bg-zinc-900/40 border border-zinc-800 rounded p-3">
                                    <p className="text-xs text-zinc-500 font-semibold mb-1">Solved</p>
                                    <p className="text-lg font-bold text-green-400">{(viewingUser.problemsSolvedEasy || 0) + (viewingUser.problemsSolvedMedium || 0) + (viewingUser.problemsSolvedHard || 0)}</p>
                                </div>
                                <div className="bg-zinc-900/40 border border-zinc-800 rounded p-3">
                                    <p className="text-xs text-zinc-500 font-semibold mb-1">Streak</p>
                                    <p className="text-lg font-bold text-orange-400">{viewingUser.streak || 0}</p>
                                </div>
                                <div className="bg-zinc-900/40 border border-zinc-800 rounded p-3">
                                    <p className="text-xs text-zinc-500 font-semibold mb-1">Rank</p>
                                    <p className="text-lg font-bold text-blue-400">#{viewingUser.rank || 'N/A'}</p>
                                </div>
                            </div>

                            {/* Difficulty Breakdown */}
                            <div className="bg-zinc-900/20 border border-zinc-800 rounded p-4">
                                <h3 className="text-sm font-bold text-white mb-3">Problem Breakdown</h3>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="text-center">
                                        <p className="text-lg font-bold text-green-400">{viewingUser.problemsSolvedEasy || 0}</p>
                                        <p className="text-xs text-zinc-500 mt-1">Easy</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-lg font-bold text-yellow-400">{viewingUser.problemsSolvedMedium || 0}</p>
                                        <p className="text-xs text-zinc-500 mt-1">Medium</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-lg font-bold text-red-400">{viewingUser.problemsSolvedHard || 0}</p>
                                        <p className="text-xs text-zinc-500 mt-1">Hard</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
