
import type { GetWeatherSuggestionsOutput } from '@/ai/flows';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CloudSun, Backpack, Umbrella, Activity } from 'lucide-react';

interface WeatherSuggestionsDisplayProps {
  suggestions: GetWeatherSuggestionsOutput;
}

const suggestionCategories = [
  { key: 'weatherOverview' as const, title: 'Typical Weather Overview', icon: CloudSun },
  { key: 'suitableActivities' as const, title: 'Suitable Activities', icon: Activity },
  { key: 'packingChanges' as const, title: 'Packing Recommendations', icon: Backpack },
  { key: 'backupPlansForRain' as const, title: 'Backup Plans (for adverse weather)', icon: Umbrella },
];

export default function WeatherSuggestionsDisplay({ suggestions }: WeatherSuggestionsDisplayProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-headline text-center text-primary">
        Weather Advice for {suggestions.destinationName}
      </h2>
      <p className="text-center text-muted-foreground text-sm">
        For dates around: {suggestions.dateContext}
      </p>

      <Accordion type="multiple" defaultValue={suggestionCategories.map(c => c.key)} className="w-full space-y-3">
        {suggestionCategories.map(category => {
          const content = suggestions[category.key];
          if (!content) return null;

          return (
            <AccordionItem value={category.key} key={category.key} className="border-none">
              <Card className="shadow-md glassmorphic-card">
                <AccordionTrigger className="text-lg hover:no-underline p-4">
                  <div className="flex items-center">
                    <category.icon className="mr-3 h-6 w-6 text-accent" />
                    <span className="font-semibold text-primary/90">{category.title}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-0">
                  <p className="text-foreground/90 whitespace-pre-line text-sm leading-relaxed bg-muted/30 dark:bg-muted/20 p-3 rounded-md">
                    {content}
                  </p>
                </AccordionContent>
              </Card>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
