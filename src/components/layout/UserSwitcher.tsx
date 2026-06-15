'use client';

import { useApp, useActiveUser } from '@/lib/context';
import * as store from '@/lib/store';

export default function UserSwitcher() {
  const { data, dispatch } = useApp();
  const activeUser = useActiveUser();

  return (
    <div className="flex gap-2">
      {data.users.map(user => (
        <button
          key={user.id}
          onClick={() => dispatch(d => store.setActiveUser(d, user.id))}
          title={user.name}
          className="flex-1 flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-200"
          style={{
            background: user.id === data.activeUserId
              ? `${user.color}22`
              : 'transparent',
            border: `1px solid ${user.id === data.activeUserId ? user.color + '44' : '#ffffff09'}`,
            color: user.id === data.activeUserId ? user.color : '#64748b',
          }}
        >
          <span>{user.avatar}</span>
          <span className="truncate">{user.name}</span>
        </button>
      ))}
    </div>
  );
}
