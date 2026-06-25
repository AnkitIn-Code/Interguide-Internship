import React from 'react';
import {
  FileText, Search, Sparkles, LayoutGrid, MessageCircle,
  User, Upload, ChevronRight, Zap
} from 'lucide-react';

const actions = [
  { id: 'resume-builder',   label: 'Launch Resume Builder',                  icon: FileText,      route: '/resume-tools' },
  { id: 'discover',         label: 'Explore Internship Discovery',            icon: Search,        route: '/job-search' },
  { id: 'recommendations',  label: 'AI Recommended Internships',              icon: Sparkles,      route: '/internship-recommendations' },
  { id: 'tracker',          label: 'Application Tracker (Kanban & Calendar)', icon: LayoutGrid,    route: '/application-tracker' },
  { id: 'ai-chat',          label: 'AI Career Assistant Chat',                icon: MessageCircle, route: '/ai-interview' },
  { id: 'profile',          label: 'Complete Profile Info',                   icon: User,          route: '/user-profile-management' },
  { id: 'upload-resume',    label: 'Upload Latest Resume',                    icon: Upload,        route: '/resume-tools' },
];

const QuickActions = ({ onNavigate }) => {
  return (
    <div className="bg-card border border-border rounded-2xl shadow-elevation-1 overflow-hidden">
      {/* Gradient top accent */}
      <div className="h-0.5 w-full gradient-primary" />

      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 sm:px-5 py-3.5 sm:py-4 border-b border-border">
        <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
          <Zap className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="font-bold text-sm text-foreground tracking-wide">
          Quick Actions
        </span>
      </div>

      {/* Action list */}
      <div className="p-2.5 sm:p-3 space-y-1">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => onNavigate(action.route)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 hover:bg-muted group border border-transparent hover:border-border"
            >
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors duration-200">
                <Icon className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="flex-1 text-sm font-medium text-foreground group-hover:text-primary transition-colors duration-200">
                {action.label}
              </span>
              <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground group-hover:text-primary transition-all duration-200 group-hover:translate-x-0.5" />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;