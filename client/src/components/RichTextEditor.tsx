import { useState, useEffect } from 'react';
import { FormControl, FormDescription, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

// Dynamic import for ReactQuill to avoid SSR issues
const ReactQuillComponent = ({ value, onChange, placeholder = '', ...props }: any) => {
  const [ReactQuill, setReactQuill] = useState<any>(null);

  useEffect(() => {
    // Dynamic import to avoid SSR issues
    import('react-quill').then((module) => {
      setReactQuill(module.default);
    });
  }, []);

  // Toolbar configuration
  const modules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote'],
      [{ 'header': 1 }, { 'header': 2 }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['clean']
    ],
  };

  const formats = [
    'bold', 'italic', 'underline', 'strike',
    'blockquote', 'header', 'list', 'bullet'
  ];

  // Show loading state while ReactQuill is loading
  if (!ReactQuill) {
    return (
      <div className="h-32 bg-gray-100 border border-gray-300 rounded-md flex items-center justify-center">
        <span className="text-gray-500">Editor wird geladen...</span>
      </div>
    );
  }

  return (
    <div className="rich-text-editor">
      <ReactQuill
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        theme="snow"
        className="bg-white"
        style={{ height: '200px', marginBottom: '50px' }}
        {...props}
      />
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
      <FormLabel className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </FormLabel>
      <FormControl>
        <ReactQuillComponent
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