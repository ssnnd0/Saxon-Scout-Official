import React, { ReactNode } from 'react';
import { X } from 'lucide-react';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  actions?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'danger' | 'secondary';
    disabled?: boolean;
  }[];
  maxWidth?: string;
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  children,
  actions,
  maxWidth = 'max-w-md'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        className={`${maxWidth} bg-white dark:bg-obsidian-light rounded-2xl shadow-2xl animate-fade-in border border-slate-200 dark:border-slate-700`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={24} className="text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto text-slate-700 dark:text-slate-300">
          {children}
        </div>

        {/* Actions */}
        {actions && actions.length > 0 && (
          <div className="flex gap-3 p-6 border-t border-slate-200 dark:border-slate-700 justify-end">
            {actions.map((action, idx) => {
              const baseStyles =
                'px-4 py-2 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed';
              const variants = {
                primary:
                  'bg-matcha hover:bg-matcha-dark text-obsidian active:scale-95',
                danger: 'bg-red-600 hover:bg-red-700 text-white active:scale-95',
                secondary: 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600'
              };

              return (
                <button
                  key={idx}
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className={`${baseStyles} ${variants[action.variant || 'secondary']}`}
                >
                  {action.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export const useDialog = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [config, setConfig] = React.useState<Partial<DialogProps>>({});

  const openDialog = (dialogConfig: Omit<DialogProps, 'isOpen' | 'onClose'>) => {
    setConfig(dialogConfig);
    setIsOpen(true);
  };

  const closeDialog = () => {
    setIsOpen(false);
  };

  return {
    isOpen,
    openDialog,
    closeDialog,
    dialogProps: {
      isOpen,
      onClose: closeDialog,
      ...config
    } as DialogProps
  };
};
