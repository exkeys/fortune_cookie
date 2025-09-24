import Header from '../../components/feature/Header';
import Card from '../../components/base/Card';
import ErrorMessage from './components/ErrorMessage';
import NavigationButtons from './components/NavigationButtons';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      <Header />
      
      <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[calc(100vh-80px)]">
        <Card className="p-12 md:p-16 lg:p-20 text-center bg-white/70 backdrop-blur-sm border-0 shadow-xl max-w-4xl mx-auto">
          <ErrorMessage />
          <NavigationButtons />
        </Card>
      </div>
    </div>
  );
}