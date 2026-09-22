export default function Landing() {
    return (
      <section className="landing">
        <h1>AI Capsule</h1>
        <p>
          A private prompt library. Sign in and save the AI prompts you actually
          want to reuse - project, version, category, whether it worked, and
          your notes - all in one place, tied to your account.
        </p>
        {/* Plain <a>, NOT a react-router <Link>, so this is a real browser
            navigation straight to the Express /login route (which redirects
            to GitHub). A client-side route change would never reach the server. */}
        <a className="btn" href="/login">
          Sign in with GitHub
        </a>
      </section>
    );
  }