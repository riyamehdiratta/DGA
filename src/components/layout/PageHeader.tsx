interface PageHeaderProps {
  title: string;
  description?: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header className="mb-6 border-b border-gray-300 pb-4">
      <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      {description && (
        <p className="mt-1 text-sm text-gray-600">{description}</p>
      )}
    </header>
  );
}
