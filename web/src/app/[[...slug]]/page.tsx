import { generateStaticParams } from './staticParams';

export { generateStaticParams };

type PageProps = {
  params: {
    slug: string[];
  };
  searchParams: { [key: string]: string | string[] | undefined };
};

export default async function Page({ params }: PageProps) {
  return <div>Dynamic page: {params.slug?.join('/') || 'home'}</div>;
}
