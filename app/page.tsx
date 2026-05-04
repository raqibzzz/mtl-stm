import { redirect } from 'next/navigation';
import { DEFAULT_ORIGIN } from '@/lib/constants';

export default function Home() {
  redirect(`/mtl/@${DEFAULT_ORIGIN.lat},${DEFAULT_ORIGIN.lon}`);
}
