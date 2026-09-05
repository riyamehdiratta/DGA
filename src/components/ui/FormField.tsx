interface FormFieldProps {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  unit?: string;
  required?: boolean;
}

export function FormField({
  label,
  htmlFor,
  children,
  unit,
  required = false,
}: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={htmlFor} className="text-xs font-medium text-gray-700">
        {label}
        {required && <span className="text-red-600"> *</span>}
        {unit && <span className="font-normal text-gray-500"> ({unit})</span>}
      </label>
      {children}
    </div>
  );
}

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
}

export function TextInput({ id, className = '', ...props }: TextInputProps) {
  return (
    <input
      id={id}
      className={`w-full px-3 py-2 text-sm ${className}`}
      {...props}
    />
  );
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  id: string;
}

export function TextArea({ id, className = '', ...props }: TextAreaProps) {
  return (
    <textarea
      id={id}
      rows={3}
      className={`w-full px-3 py-2 text-sm resize-y ${className}`}
      {...props}
    />
  );
}
