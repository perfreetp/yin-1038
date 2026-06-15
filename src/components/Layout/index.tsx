import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
  sidebarCurrentPath: string;
  onSidebarNavigate: (path: string) => void;
  headerTitle: string;
  onAddMaterial?: () => void;
  onAddProject?: () => void;
  addButtonLabel?: string;
}

export function Layout({
  children,
  sidebarCurrentPath,
  onSidebarNavigate,
  headerTitle,
  onAddMaterial,
  onAddProject,
  addButtonLabel,
}: LayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      <Sidebar currentPath={sidebarCurrentPath} onNavigate={onSidebarNavigate} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title={headerTitle}
          onAddMaterial={onAddMaterial}
          onAddProject={onAddProject}
          addButtonLabel={addButtonLabel}
        />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

export { Sidebar } from './Sidebar';
export { Header } from './Header';
