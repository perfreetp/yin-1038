import {
  LayoutDashboard,
  Package,
  ArrowRightLeft,
  FolderKanban,
  Bell,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useUIStore } from '../../store/useUIStore';

const navItems = [
  { id: 'materials', label: '材料总览', icon: Package, path: '/materials' },
  { id: 'borrow', label: '借出登记', icon: ArrowRightLeft, path: '/borrow' },
  { id: 'projects', label: '项目关联', icon: FolderKanban, path: '/projects' },
  { id: 'reminders', label: '到期提醒', icon: Bell, path: '/reminders' },
  { id: 'analytics', label: '统计分析', icon: BarChart3, path: '/analytics' },
];

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export function Sidebar({ currentPath, onNavigate }: SidebarProps) {
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  return (
    <aside
      className={cn(
        'h-full bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300',
        sidebarOpen ? 'w-60' : 'w-16',
      )}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
        {sidebarOpen && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-slate-100">材料管理</span>
          </div>
        )}
        {!sidebarOpen && (
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center mx-auto">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
        )}
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path || currentPath.startsWith(item.path + '/');
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.path)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-all duration-200 group',
                isActive
                  ? 'bg-blue-600/20 text-blue-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800',
                !sidebarOpen && 'justify-center',
              )}
            >
              <Icon
                className={cn(
                  'w-5 h-5 flex-shrink-0 transition-colors',
                  isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300',
                )}
              />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="p-2 border-t border-slate-800">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-full flex items-center justify-center py-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded transition-colors"
        >
          {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
      </div>
    </aside>
  );
}
