import { ClientApp } from './client';
import { paths } from '../../config/paths'; // Import paths

// Helper function to flatten the paths object and format for generateStaticParams
function getAllPaths(obj: object): { slug: string[] }[] {
  let pathList: { slug: string[] }[] = [];

  function recurse(currentObj: any, currentPath: string[] = []) {
    for (const key in currentObj) {
      const value = currentObj[key];
      if (typeof value === 'string') {
        // Split the path, remove leading slash if present
        const slugParts = value.split('/').filter((part) => part !== '');
        pathList.push({ slug: slugParts });
      } else if (typeof value === 'object' && value !== null) {
        // Recurse into nested objects (but don't add the intermediate keys like 'global' or 'clients' to the path)
        recurse(value, currentPath);
      }
    }
  }

  recurse(obj);
  // Ensure uniqueness in case paths are duplicated
  const uniquePaths = Array.from(
    new Set(pathList.map((p) => JSON.stringify(p)))
  ).map((s) => JSON.parse(s));
  return uniquePaths;
}

export function generateStaticParams() {
  const allPaths = getAllPaths(paths);
  console.log(
    'Generating static params for:',
    JSON.stringify(allPaths, null, 2)
  ); // Log generated paths
  return allPaths;
}

export default function Page() {
  return <ClientApp />;
}
