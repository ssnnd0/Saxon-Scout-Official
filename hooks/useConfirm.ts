import { useState } from 'react';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDangerous?: boolean;
}

export const useConfirm = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<ConfirmOptions | null>(null);
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);

  const confirm = (options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfig(options);
      setIsOpen(true);
      setResolvePromise(() => (value: boolean) => {
        resolve(value);
        setIsOpen(false);
      });
    });
  };

  const handleConfirm = () => {
    if (resolvePromise) {
      resolvePromise(true);
    }
  };

  const handleCancel = () => {
    if (resolvePromise) {
      resolvePromise(false);
    }
  };

  return {
    isOpen,
    config,
    confirm,
    handleConfirm,
    handleCancel
  };
};
