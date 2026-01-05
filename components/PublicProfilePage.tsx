import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { X } from 'lucide-react';

interface PublicProfilePageProps {
    username: string;
    shareCode: string;
    onClose: () => void;
}

export const PublicProfilePage: React.FC<PublicProfilePageProps> = ({ username, shareCode, onClose }) => {
    const [profileData, setProfileData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);
                console.log('[PublicProfile] Fetching profile for:', username, 'with shareCode:', shareCode);
                const profile = await apiService.getPublicProfile(username, shareCode);
                console.log('[PublicProfile] Profile fetched successfully:', profile);
                setProfileData(profile);
                setError(null);
            } catch (err) {
                console.error('[PublicProfile] Error fetching public profile:', err);
                setError('Failed to load profile');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [username, shareCode]);

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black text-white flex items-center justify-center z-[300]">
                <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error || !profileData) {
        return (
            <div className="fixed inset-0 bg-black text-white flex items-center justify-center z-[300]">
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 max-w-md">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold">Error</h2>
                        <button onClick={onClose} className="text-zinc-500 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <p className="text-zinc-400 mb-4">{error || 'Profile not found'}</p>
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded font-semibold transition-all"
                    >
                        Close
                    </button>
                </div>
            </div>
        );
    }

    const today = new Date();
    const yearStart = new Date(today.getFullYear(), 0, 1);
    const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    const generateWeeks = () => {
        const weeks: (number | null)[][] = [];
        let currentWeek: (number | null)[] = [];
        
        const startDay = yearStart.getDay();
        for (let i = 0; i < startDay; i++) {
            currentWeek.push(null);
        }
        
        const currentDate = new Date(yearStart);
        while (currentDate <= today) {
            currentWeek.push(currentDate.getDate());
            
            if (currentWeek.length === 7) {
                weeks.push(currentWeek);
                currentWeek = [];
            }
            
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
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
                                    <span className="text-lg font-bold">{profileData.name.charAt(0).toUpperCase()}</span>
                                </div>
                                <div>
                                    <h1 className="text-lg font-bold text-white">{profileData.name}</h1>
                                    <p className="text-xs text-zinc-400">{profileData.rank}</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="text-zinc-500 hover:text-white p-1">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Quick Stats */}
                        <div className="flex justify-center mb-8">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-2xl">
                                <div className="bg-zinc-900/40 border border-zinc-800 rounded p-3">
                                    <p className="text-xs text-zinc-500 font-semibold mb-1">Impact</p>
                                    <p className="text-xl font-bold text-violet-400">{profileData.impactScore}</p>
                                </div>
                                <div className="bg-zinc-900/40 border border-zinc-800 rounded p-3">
                                    <p className="text-xs text-zinc-500 font-semibold mb-1">Solved</p>
                                    <p className="text-xl font-bold text-green-400">{profileData.totalProblemsSolved}</p>
                                </div>
                                <div className="bg-zinc-900/40 border border-zinc-800 rounded p-3">
                                    <p className="text-xs text-zinc-500 font-semibold mb-1">Streak</p>
                                    <p className="text-xl font-bold text-orange-400">{profileData.streak}</p>
                                </div>
                                <div className="bg-zinc-900/40 border border-zinc-800 rounded p-3">
                                    <p className="text-xs text-zinc-500 font-semibold mb-1">Rank</p>
                                    <p className="text-xl font-bold text-blue-400">#{profileData.leaderboardRank}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Problem Breakdown */}
                            <div className="bg-zinc-900/20 border border-zinc-800 rounded p-4">
                                <h3 className="text-sm font-bold text-white mb-4">Problems Solved</h3>
                                <div className="space-y-3">
                                    <div className="text-center">
                                        <p className="text-lg font-bold text-green-400">{profileData.problemsSolvedEasy}</p>
                                        <p className="text-xs text-zinc-500 mt-1">Easy</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-lg font-bold text-yellow-400">{profileData.problemsSolvedMedium}</p>
                                        <p className="text-xs text-zinc-500 mt-1">Medium</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-lg font-bold text-red-400">{profileData.problemsSolvedHard}</p>
                                        <p className="text-xs text-zinc-500 mt-1">Hard</p>
                                    </div>
                                </div>
                            </div>

                            {/* Activity Calendar */}
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
                                                        const problemsCount = profileData.problemsPerDay[dateStr] || 0;
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
                </div>
            </div>
        </div>
    );
};
