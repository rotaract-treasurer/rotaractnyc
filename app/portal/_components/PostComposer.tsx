'use client';

import { useAuth } from '@/lib/firebase/auth';

export default function PostComposer() {
  const { user } = useAuth();

  return (
    <div className="bg-white dark:bg-[#1e1e1e] p-4 rounded-xl shadow-sm border border-gray-100 dark:border-[#2a2a2a] flex gap-4 items-center">
      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden flex-shrink-0">
        {user?.photoURL ? (
          <img 
            src={user.photoURL} 
            alt="Current user avatar" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <span className="material-symbols-outlined">person</span>
          </div>
        )}
      </div>
      <div className="flex-1">
        <button className="w-full text-left bg-[#f5f5f7] dark:bg-[#2a2a2a] text-gray-500 dark:text-gray-400 py-2.5 px-4 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-[#333] transition-colors">
          Share an announcement or update...
        </button>
      </div>
    </div>
  );
}
