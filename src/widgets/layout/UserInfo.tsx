import { LogIn, User } from "lucide-react";

interface UserInfoProps {
  user?: {
    name: string;
    email?: string;
    avatarUrl?: string;
  };
  onSignIn?: () => void;
}

export const UserInfo = ({ user, onSignIn }: UserInfoProps) => {
  if (!user) {
    return (
      <button
        onClick={onSignIn}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors group"
      >
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-gray-400" />
        </div>
        <div className="flex-1 text-left min-w-0">
          <div className="text-sm font-medium text-gray-300">로그인</div>
          <div className="text-xs text-gray-500">계정에 로그인하세요</div>
        </div>
        <LogIn className="w-4 h-4 text-gray-500 group-hover:text-gray-400 transition-colors flex-shrink-0" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors cursor-pointer">
      {user.avatarUrl ? (
        <img
          src={user.avatarUrl}
          alt={user.name}
          className="w-9 h-9 rounded-full object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-semibold text-white">
            {user.name.charAt(0).toUpperCase()}
          </span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-200 truncate">
          {user.name}
        </div>
        {user.email && (
          <div className="text-xs text-gray-500 truncate">{user.email}</div>
        )}
      </div>
    </div>
  );
};
