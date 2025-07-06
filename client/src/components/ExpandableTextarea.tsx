import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Maximize2, Minimize2 } from 'lucide-react';

interface ExpandableTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  maxRows?: number;
  className?: string;
  label?: string;
}

export function ExpandableTextarea({
  value,
  onChange,
  placeholder,
  rows = 4,
  maxRows = 10,
  className,
  label = "Text Editor"
}: ExpandableTextareaProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [modalValue, setModalValue] = useState(value);

  const handleOpenModal = () => {
    setModalValue(value);
    setIsExpanded(true);
  };

  const handleSaveModal = () => {
    onChange(modalValue);
    setIsExpanded(false);
  };

  const handleCancelModal = () => {
    setModalValue(value);
    setIsExpanded(false);
  };

  return (
    <>
      <div className="relative">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={`pr-10 ${className}`}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute bottom-2 right-2 h-6 w-6 p-0"
          onClick={handleOpenModal}
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Minimize2 className="h-4 w-4" />
              {label}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 min-h-0">
            <Textarea
              value={modalValue}
              onChange={(e) => setModalValue(e.target.value)}
              placeholder={placeholder}
              className="min-h-[400px] resize-none"
              rows={maxRows}
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelModal}>
              Abbrechen
            </Button>
            <Button onClick={handleSaveModal}>
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}