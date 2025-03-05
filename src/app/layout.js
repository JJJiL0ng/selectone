// app/layout.jsx
import { Inter } from 'next/font/google';
import Link from 'next/link';
import './globals.css';
import { AuthProvider } from './context/authContext';
import { createClient } from './lib/supabase';
const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: '원픽 맛집지도 - 당신의 인생 맛집을 공유하세요',
  description: '모든 사람의 단 하나뿐인 맛집 추천을 한눈에 볼 수 있는 지도 서비스',
};

export default async function RootLayout({ children }) {
  const supabase = createClient();
  
  // 서버 컴포넌트에서 초기 세션 상태 확인
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return (
    <html lang="ko">
      <body className={inter.className}>
        <AuthProvider initialSession={session}>
          <main className="min-h-screen flex flex-col">
            <header className="bg-white shadow-sm py-4 px-6">
              <div className="container mx-auto flex justify-between items-center">
                <Link href="/" className="text-xl font-bold text-orange-500">selet your favorite 1</Link>
              </div>
            </header>
            <div className="flex-grow">
              {children}
            </div>
            <footer className="bg-gray-50 py-4 px-6 text-center text-sm text-gray-500">
              &copy; {new Date().getFullYear()} 원픽 맛집지도
            </footer>
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}