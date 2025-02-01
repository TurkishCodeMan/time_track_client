interface ToastProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export function useToast() {
  const toast = (props: ToastProps) => {
    // Basit bir alert göster
    const message = `${props.title}\n${props.description}`;
    alert(message);
  };

  return { toast };
} 