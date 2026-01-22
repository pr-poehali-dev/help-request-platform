import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface HeaderProps {
  onCreateClick: () => void;
}

export const Header = ({ onCreateClick }: HeaderProps) => {
  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary rounded-xl p-2">
              <Icon name="Heart" className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Помощь Рядом</h1>
              <p className="text-sm text-muted-foreground">Платформа взаимопомощи</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="ghost"
              size="sm"
              onClick={() => window.location.href = '/admin'}
            >
              <Icon name="Shield" size={16} />
            </Button>
            <Button 
              onClick={onCreateClick}
              className="bg-primary hover:bg-primary/90"
              size="lg"
            >
              <Icon name="Plus" className="mr-2" size={20} />
              Создать объявление
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
