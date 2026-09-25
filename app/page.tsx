import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect to capture by default (middleware handles authenticated users)
  redirect('/capture');
}
