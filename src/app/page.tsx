import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { WelcomePage } from '@/components/chat/WelcomePage';

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect('/reflect');
  }

  return <WelcomePage />;
}
