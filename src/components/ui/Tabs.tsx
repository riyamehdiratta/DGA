interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div className="border-b border-gray-300">
      <nav className="flex gap-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`border-b-2 px-5 py-3 text-sm ${
              activeTab === tab.id
                ? 'border-gray-800 font-medium text-gray-900'
                : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
