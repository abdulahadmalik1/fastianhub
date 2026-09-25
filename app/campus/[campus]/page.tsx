import { notFound } from 'next/navigation';
import PastPapersView from '@/components/PastPapersView';
import StructuredData from '@/components/StructuredData';
import { campusOptions, getCampusBySlug } from '@/lib/campuses';
import { collectionSchema, pageMetadata } from '@/lib/seo';

type Props = { params: Promise<{ campus: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return campusOptions.map(campus => ({ campus: campus.slug }));
}

function getPageDetails(slug: string) {
  const campus = getCampusBySlug(slug);
  if (!campus) notFound();
  return {
    campus,
    path: `/campus/${campus.slug}`,
    title: `FAST ${campus.searchName} Past Papers | FastianHub`,
    description: `Find FAST NUCES ${campus.searchName} past papers, sessionals, finals, quizzes and study resources. Browse courses by semester on FastianHub.`,
  };
}

export async function generateMetadata({ params }: Props) {
  const { title, description, path } = getPageDetails((await params).campus);
  return pageMetadata(title, description, path);
}

export default async function CampusPage({ params }: Props) {
  const { campus, title, description, path } = getPageDetails((await params).campus);
  return <>
    <StructuredData data={collectionSchema(title, description, path, campus.searchName)} />
    <PastPapersView key={campus.id} initialCampus={campus.id} />
  </>;
}
