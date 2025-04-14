import { generateStaticParams } from './staticParams';

export { generateStaticParams };

interface PageProps {
  params: {
    slug: string[] | undefined;
  };
}

export default function Page({ params }: PageProps) {
  return <div>Dynamic page: {params.slug?.join('/') || 'home'}</div>;
}
