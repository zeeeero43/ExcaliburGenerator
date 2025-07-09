import { useState, useEffect } from 'react';
import { FormControl, FormDescription, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';

// Simple Rich Text Component using buttons for formatting
const SimpleRichTextComponent = ({ value, onChange, placeholder = '', ...props }: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const [textValue, setTextValue] = useState(value || '');

  useEffect(() => {
    setTextValue(value || '');
  }, [value]);

  const handleChange = (newValue: string) => {
    setTextValue(newValue);
    onChange(newValue);
  };

  const insertFormat = (startTag: string, endTag: string = '') => {
    const textarea = document.querySelector('.rich-text-textarea') as HTMLTextAreaElement;
    if (!textarea) {
      console.error('Textarea not found');
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textValue.substring(start, end);
    
    const beforeText = textValue.substring(0, start);
    const afterText = textValue.substring(end);
    
    // Preserve formatting in translations by not stripping tags
    const newText = beforeText + startTag + selectedText + endTag + afterText;
    handleChange(newText);
    
    // Set cursor position after the inserted tag
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + startTag.length + selectedText.length + endTag.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 10);
  };

  return (
    <div className="rich-text-editor border border-gray-300 rounded-md">
      {/* Toolbar */}
      <div className="border-b border-gray-300 p-2 bg-gray-50 flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => insertFormat('**', '**')}
          className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
          title="Fett"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => insertFormat('*', '*')}
          className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
          title="Kursiv"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={() => insertFormat('_', '_')}
          className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
          title="Unterstrichen"
        >
          <u>U</u>
        </button>
        <div className="border-l border-gray-300 mx-1"></div>
        <button
          type="button"
          onClick={() => insertFormat('## ', '')}
          className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
          title="Überschrift"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => insertFormat('### ', '')}
          className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
          title="Kleine Überschrift"
        >
          H3
        </button>
        <div className="border-l border-gray-300 mx-1"></div>
        <button
          type="button"
          onClick={() => insertFormat('- ', '')}
          className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
          title="Liste"
        >
          •
        </button>
        <button
          type="button"
          onClick={() => insertFormat('1. ', '')}
          className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
          title="Nummerierte Liste"
        >
          1.
        </button>
      </div>
      
      {/* Text Area */}
      <Textarea
        className="rich-text-textarea border-0 rounded-none rounded-b-md resize-vertical"
        value={textValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder + " (Mit Formatierung: **fett**, *kursiv*, _unterstrichen_, ## Überschrift)"}
        rows={8}
        {...props}
      />
      
      {/* Preview (optional) */}
      {textValue && (
        <div className="border-t border-gray-300 p-3 bg-gray-50">
          <div className="text-xs text-gray-600 mb-2">Vorschau:</div>
          <div 
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{
              __html: textValue
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/_(.*?)_/g, '<u>$1</u>')
                .replace(/^## (.*$)/gm, '<h2>$1</h2>')
                .replace(/^### (.*$)/gm, '<h3>$1</h3>')
                .replace(/^- (.*$)/gm, '• $1')
                .replace(/^(\d+)\. (.*$)/gm, '$1. $2')
                .replace(/\n/g, '<br>')
            }}
          />
        </div>
      )}
    </div>
  );
};

interface RichTextEditorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  description?: string;
  error?: string;
  required?: boolean;
}

export const RichTextEditor = ({ 
  label, 
  value, 
  onChange, 
  placeholder = '', 
  description,
  error,
  required = false 
}: RichTextEditorProps) => {
  return (
    <FormItem>
      {label && (
        <FormLabel className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </FormLabel>
      )}
      <FormControl>
        <SimpleRichTextComponent
          value={value}
          onChange={onChange}
          placeholder={placeholder}
        />
      </FormControl>
      {description && (
        <FormDescription className="text-xs text-gray-500">
          {description}
        </FormDescription>
      )}
      {error && (
        <FormMessage className="text-red-500 text-sm">
          {error}
        </FormMessage>
      )}
    </FormItem>
  );
};

export default RichTextEditor;