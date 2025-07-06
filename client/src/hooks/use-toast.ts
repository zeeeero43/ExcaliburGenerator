export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  action?: React.ReactNode;
}

export function useToast() {
  const toast = ({ title, description, variant = 'default' }: Omit<Toast, 'id'>) => {
    console.log('Toast:', { title, description, variant });
    return { id: '1', dismiss: () => {} };
  };

  return {
    toasts: [],
    toast,
    dismiss: () => {},
  };
}