export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main>
      <h1>Daily Brief</h1>
      <p className="subtitle">Enter your passcode.</p>
      <form method="post" action="/api/login">
        <input type="password" name="passcode" autoComplete="current-password" autoFocus required />
        {error && <p className="status">That passcode didn&apos;t match.</p>}
        <div className="row">
          <button className="button" type="submit">
            Open
          </button>
        </div>
      </form>
    </main>
  );
}
