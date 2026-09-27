import Link from 'next/link';
import Icon from '@/components/Icon';
import StructuredData from '@/components/StructuredData';
import { campusOptions } from '@/lib/campuses';
import { pageMetadata } from '@/lib/seo';
import { SITE_NAME, SITE_URL } from '@/lib/site-config';

const title = 'Our Story: wondar.site & FAST Past Papers | FastianHub';
const description = 'Why we built FastianHub after using wondar.site for FAST NUCES past papers. Find campus resources for sessionals, final exams, quizzes and study preparation.';
const url = `${SITE_URL}/motivation`;

export const metadata = pageMetadata(title, description, '/motivation');

export default function MotivationPage() {
  return <div className="app-shell story-page">
    <StructuredData data={{
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      '@id': `${url}#webpage`,
      url,
      name: title,
      description,
      inLanguage: 'en',
      isPartOf: { '@id': `${SITE_URL}/#website` },
      about: { '@type': 'WebSite', '@id': `${SITE_URL}/#website`, name: SITE_NAME, url: `${SITE_URL}/` },
    }} />
    <a className="skip-link" href="#our-story">Skip to our story</a>
    <header className="site-header"><div className="container header-inner">
      <Link href="/" className="brand" aria-label="FastianHub home"><span className="brand-mark"><Icon name="book" size={22} /></span><span>Fastian<span className="brand-light">Hub</span><small>THE STUDENT ARCHIVE</small></span></Link>
      <Link href="/" className="text-button">Home <Icon name="arrow" size={18} /></Link>
    </div></header>
    <main className="container" id="our-story">
      <section className="story-intro" aria-labelledby="story-title">
        <p className="eyebrow"><span /> OUR MOTIVATION</p>
        <h1 id="story-title">Why we built<br /><em>FastianHub.</em></h1>
        <p className="story-lead">A familiar search before an exam. A collection that helped. And a reason to make useful study resources easier to find.</p>
      </section>
      <div className="story-layout">
        <article className="story-copy" aria-label="The story behind FastianHub">
          <section aria-labelledby="wondar-inspiration">
            <h2 id="wondar-inspiration">The inspiration: wondar.site</h2>
            <p>Before building FastianHub, we used wondar.site to find FAST NUCES past papers. It was one of our favourite resources when an exam was approaching: a place to look for earlier papers and get a clearer idea of what to practise.</p>
            <p>That experience showed us how much a student-built resource can help. When a familiar collection becomes difficult to reach, students end up searching again through old links, shared folders and group messages. We wanted to make that search a little easier for the next Fastian.</p>
          </section>
          <section aria-labelledby="papers-purpose">
            <h2 id="papers-purpose">More time to prepare for the next exam</h2>
            <p>Our motivation was simple: bring useful FAST past papers and course materials into a browser that students can explore by campus, semester and course. Find a subject, open a paper, and get back to studying.</p>
            <p>Whether you are revising Programming Fundamentals (PF), Object Oriented Programming (OOP), Data Structures (DS), or Digital Logic Design (DLD), an earlier paper can help you spot topics to revisit and practise explaining your answers. It is a starting point for preparation alongside your current course outline and lectures.</p>
          </section>
          <section aria-labelledby="exam-resources">
            <h2 id="exam-resources">From sessionals to final exams</h2>
            <p>The archive brings together midterm and sessional papers, final exam papers, quizzes, assignments, lab tasks, course outlines and study notes where contributors have shared them. Availability varies by course and campus.</p>
            <p>For exam preparation, start with the topics covered in your own class. Try a past paper under timed conditions, review the questions you struggled with, and use relevant notes or lab exercises to work through those gaps. Check the campus and course before choosing a paper, because syllabuses and exam formats can differ.</p>
          </section>
          <section aria-labelledby="community-story">
            <h2 id="community-story">A shared effort, across campuses</h2>
            <p>FastianHub supports Islamabad, Karachi, Lahore and Chiniot-Faisalabad (CFD). Those collections exist because students chose to share what helped them. We are grateful to the archive maintainers and contributors whose work makes these resources available.</p>
            <p>You can meet them on our <Link href="/credits">Credits page</Link>, or use the contribution option on the homepage to suggest another collection. The aim is to keep useful material within reach as new students arrive and courses change.</p>
          </section>
          <section className="story-welcome" aria-labelledby="wondar-visitors">
            <h2 id="wondar-visitors">Looking for wondar.site past papers?</h2>
            <p>If your search brought you here, start with your campus and explore the papers available on FastianHub. We are an independent student project, unaffiliated with wondar.site or FAST-NUCES. This is our own community archive, and we do not claim to have every resource previously available on wondar.</p>
            <Link href="/" className="primary-button">Browse past papers <Icon name="arrow" size={18} /></Link>
          </section>
        </article>
        <aside className="story-campus-panel" aria-labelledby="story-campus-title">
          <span className="community-icon"><Icon name="book" size={24} /></span>
          <h2 id="story-campus-title">Find your campus.</h2>
          <p>Explore the FAST past-paper collection that fits your courses.</p>
          <nav aria-label="Past papers by campus">
            {campusOptions.map(campus => <Link key={campus.id} href={`/campus/${campus.slug}`}>
              <span>{campus.name}<small>Past papers &amp; resources</small></span><Icon name="arrow" size={17} />
            </Link>)}
          </nav>
          <Link href="/" className="text-button">Back to home <Icon name="arrow" size={17} /></Link>
        </aside>
      </div>
    </main>
    <footer className="container site-footer"><p>By Fastians, for Fastians.</p><nav aria-label="Community links"><Link href="/">Home</Link><Link href="/credits">Credits</Link></nav></footer>
  </div>;
}
