import Image from "next/image";
import Link from "next/link";

const loginForExplorer = "/login?next=%2Fgenius-corner";

export default function Home() {
  return (
    <div className="bright-landing">
      <header className="bright-header">
        <div className="bright-header-inner">
          <Link href="/" className="bright-wordmark" aria-label="BrightKids.Space home">
            brightkids<span>.space</span><i aria-hidden="true">✦</i>
          </Link>
          <nav className="bright-nav" aria-label="Main navigation">
            <a href="#how-it-works">How it works</a>
            <a href="#parents">For parents</a>
            <Link href={loginForExplorer}>Explore</Link>
          </nav>
          <div className="bright-header-actions">
            <Link className="bright-signin" href="/login">Sign in</Link>
            <Link className="bright-button bright-button-small" href={loginForExplorer}>Start exploring</Link>
          </div>
        </div>
      </header>

      <main>
        <section className="bright-hero" aria-labelledby="hero-title">
          <div className="bright-hero-inner">
            <div className="bright-hero-copy">
              <h1 id="hero-title">Make “why?” your favourite question.</h1>
              <p>Big ideas, made clear. Explore school topics with interactive lessons built for Grades 6–8.</p>
              <div className="bright-hero-actions">
                <Link className="bright-button" href={loginForExplorer}>Explore a topic <span aria-hidden="true">↗</span></Link>
                <a className="bright-text-link" href="#how-it-works">See how it works</a>
              </div>
            </div>
            <div className="bright-hero-art">
              <Image
                src="/brand/curiosity-world.png"
                alt="Two students explore a tiny science world with planets, a telescope and a notebook."
                width={1536}
                height={1024}
                priority
                sizes="(max-width: 760px) 100vw, 58vw"
              />
            </div>
          </div>
        </section>

        <section className="bright-discovery" id="how-it-works" aria-labelledby="discovery-title">
          <div className="bright-discovery-inner">
            <div className="bright-steps">
              <h2 id="discovery-title">Start with a question.<br />Leave with an “aha!”</h2>
              <ol>
                <li>
                  <span className="bright-step-number step-blue">01</span>
                  <div><h3>Pick a topic</h3><p>Choose something from class—or something you’ve always wondered.</p></div>
                </li>
                <li>
                  <span className="bright-step-number step-coral">02</span>
                  <div><h3>Explore the picture</h3><p>Tap the parts that make you curious. The idea opens up as you go.</p></div>
                </li>
                <li>
                  <span className="bright-step-number step-yellow">03</span>
                  <div><h3>Go one level deeper</h3><p>Get clear explanations that grow from Grade 6 to Grade 8.</p></div>
                </li>
              </ol>
            </div>
            <div className="bright-notebook-art">
              <Image
                src="/brand/gravity-notebook.png"
                alt="An open science notebook illustrates how Earth’s gravity pulls an apple while the Moon follows an orbit."
                width={1536}
                height={1024}
                sizes="(max-width: 760px) 100vw, 52vw"
              />
            </div>
          </div>
        </section>

        <section className="bright-parents" id="parents" aria-labelledby="parents-title">
          <div className="bright-parents-inner">
            <h2 id="parents-title">Clear enough for kids.<br className="mobile-break" /> Reassuring for parents.</h2>
            <p className="bright-parents-intro">Curriculum-aware explanations, thoughtful practice and progress that’s easy to follow.</p>
            <div className="bright-parent-points">
              <div><span aria-hidden="true">✳</span><p>Grade 6–8 learning</p></div>
              <div><span aria-hidden="true">↗</span><p>Interactive explanations</p></div>
              <div><span aria-hidden="true">▱</span><p>A personal study space</p></div>
            </div>
          </div>
        </section>

        <section className="bright-last-call" aria-labelledby="last-call-title">
          <div className="bright-last-call-copy">
            <h2 id="last-call-title">Got a question in mind?</h2>
            <p>Bring it along. There’s always something new to figure out.</p>
          </div>
          <Link className="bright-button bright-button-light" href={loginForExplorer}>Start exploring <span aria-hidden="true">↗</span></Link>
          <span className="bright-sparkle sparkle-one" aria-hidden="true">✦</span>
          <span className="bright-sparkle sparkle-two" aria-hidden="true">✳</span>
        </section>
      </main>

      <footer className="bright-footer">
        <Link href="/" className="bright-wordmark">brightkids<span>.space</span><i aria-hidden="true">✦</i></Link>
        <p>Curiosity looks good on you.</p>
        <Link href="/login">Sign in</Link>
      </footer>
    </div>
  );
}
