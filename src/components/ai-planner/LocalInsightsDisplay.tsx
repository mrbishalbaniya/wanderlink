
import type { GetLocalInsightsOutput } from '@/ai/flows';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { BookOpen, ShieldAlert, Ban, UtensilsIcon } from 'lucide-react'; // Changed Utensils to UtensilsIcon

interface LocalInsightsDisplayProps {
  insights: GetLocalInsightsOutput;
}

const insightCategories = [
  { key: 'localCustoms' as const, title: 'Local Customs & Etiquette', icon: BookOpen },
  { key: 'safetyInfo' as const, title: 'Safety Information', icon: ShieldAlert },
  { key: 'whatToAvoid' as const, title: 'What to Avoid', icon: Ban },
  { key: 'mustTryFood' as const, title: 'Must-Try Food', icon: UtensilsIcon },
];

export default function LocalInsightsDisplay({ insights }: LocalInsightsDisplayProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-headline text-center text-primary">
        Traveler's Insights for {insights.destinationName}
      </h2>

      <Accordion type="multiple" defaultValue={insightCategories.map(c => c.key)} className="w-full space-y-3">
        {insightCategories.map(category => {
          const content = insights[category.key];
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
