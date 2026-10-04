import Link from 'next/link';
import styles from './qa.module.css';

export default function QuestionNotFound() {
  return (
    <main className={`container ${styles.main} ${styles.state}`}>
      <h1>Question not available</h1>
      <p>This question may not have a published answer yet.</p>
      <Link href="/qa" className="text-button">Browse answered questions</Link>
    </main>
  );
}
