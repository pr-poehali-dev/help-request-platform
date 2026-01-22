import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import type { Announcement } from '@/lib/api';

interface AnnouncementCardProps {
  announcement: Announcement;
  currentUser: string;
  onTrackView: (id: number) => void;
  onOpenResponse: (id: number, title: string) => void;
  onOpenResponses: (id: number, title: string, isAuthor: boolean) => void;
  formatDate: (dateString: string) => string;
  getTypeInfo: (type: string) => { label: string; color: string; icon: string };
}

export const AnnouncementCard = ({
  announcement,
  currentUser,
  onTrackView,
  onOpenResponse,
  onOpenResponses,
  formatDate,
  getTypeInfo
}: AnnouncementCardProps) => {
  const typeInfo = getTypeInfo(announcement.type);
  const isAuthor = announcement.author === currentUser;

  return (
    <Card 
      key={announcement.id}
      className={`hover:shadow-lg transition-all cursor-pointer ${
        announcement.type === 'vip' 
          ? 'border-2 border-primary bg-primary/5' 
          : announcement.type === 'boosted' 
          ? 'border-warning/50' 
          : ''
      }`}
      onClick={() => onTrackView(announcement.id)}
    >
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {typeInfo.label && (
                <Badge className={typeInfo.color}>
                  <Icon name={typeInfo.icon as any} size={12} className="mr-1" />
                  {typeInfo.label}
                </Badge>
              )}
              <Badge variant="outline">{announcement.category}</Badge>
            </div>
            <h3 className="text-xl font-bold mb-2">{announcement.title}</h3>
            <p className="text-muted-foreground line-clamp-3">{announcement.description}</p>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm text-muted-foreground mt-4 pt-4 border-t">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Icon name="User" size={14} />
              <span>{announcement.author}</span>
            </div>
            <div className="flex items-center gap-1">
              <Icon name="Clock" size={14} />
              <span>{formatDate(announcement.date)}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Icon name="Eye" size={14} />
              <span>{announcement.views || 0} просмотров</span>
            </div>
          </div>
          <div className="flex gap-2">
            {isAuthor && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenResponses(announcement.id, announcement.title, true);
                }}
              >
                <Icon name="MessageSquare" size={14} className="mr-1" />
                Отклики
              </Button>
            )}
            {!isAuthor && (
              <Button 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenResponse(announcement.id, announcement.title);
                }}
              >
                <Icon name="Send" size={14} className="mr-1" />
                Откликнуться
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
