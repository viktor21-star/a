type PageStateProps = {
  message: string;
};

export function PageState({ message }: PageStateProps) {
  return (
    <section className="page-grid">
      <div className="panel">{message}</div>
    </section>
  );
}
