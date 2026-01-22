import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface FilterBarProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories: Array<{ value: string; label: string; icon: string }>;
}

export const FilterBar = ({ selectedCategory, onCategoryChange, categories }: FilterBarProps) => {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="Filter" size={20} className="text-muted-foreground" />
        <h3 className="text-sm font-medium text-muted-foreground">Фильтр по категориям:</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <Button
            key={cat.value}
            variant={selectedCategory === cat.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => onCategoryChange(cat.value)}
            className={selectedCategory === cat.value ? 'bg-primary text-white' : ''}
          >
            <Icon name={cat.icon as any} size={14} className="mr-2" />
            {cat.label}
          </Button>
        ))}
      </div>
    </div>
  );
};
