import { generateStaticParams } from './staticParams';

export { generateStaticParams };

export default function Page({ params }: { params: { slug?: string[] } }) {
  return <div>Dynamic page: {params.slug?.join('/') || 'home'}</div>;
}
