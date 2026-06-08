```tsx
import React from 'react';
import { useStore } from '@presentation/hooks/useStoreHydration';
import { uiStore } from '@application/state/stores/uiStore';

/**
 * SettingsToggle component for toggling overlay settings (e.g., click-through, visibility).
 * Uses Zustand store for state management and Tailwind for styling.
 */
const SettingsToggle: React.FC<{
  label: string;
  settingKey: keyof typeof uiStore.getState();
  description?: string;
}> = ({ label, settingKey, description }) => {
  const [value, toggleSetting] = useStore(uiStore, (state) => [
    state[settingKey],
    state.toggleSetting,
  ]);

  return (
    <div className="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => toggleSetting(settingKey)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
          value ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
        }`}
      >
        <span
          className={`${
            value ? 'translate-x-6' : 'translate-x-1'
          } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
        />
      </button>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {label}
        </span>
        {description && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {description}
          </span>
        )}
      </div>
    </div>
  );
};

export default SettingsToggle;
```