import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { redirect } from 'next/navigation';
import { RootChat } from '@/components/chat/RootChat';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect('/reflect');
  }

  return <RootChat />;
}