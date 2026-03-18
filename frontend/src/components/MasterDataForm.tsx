type MasterDataFormProps = {
  title: string;
  children: React.ReactNode;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  submitLabel: string;
};

export function MasterDataForm({ title, children, onSubmit, submitLabel }: MasterDataFormProps) {
  return (
    <article className="panel">
      <div className="panel-header">
        <h3>{title}</h3>
      </div>
      <form className="master-form" onSubmit={onSubmit}>
        {children}
        <button className="action-button" type="submit">
          {submitLabel}
        </button>
      </form>
    </article>
  );
}
