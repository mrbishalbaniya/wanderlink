
import type { PlanTripOutput } from '@/ai/flows';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CalendarDays, Utensils, Lightbulb, MapPin, DollarSign } from 'lucide-react';

interface ItineraryDisplayProps {
  plan: PlanTripOutput;
}

export default function ItineraryDisplay({ plan }: ItineraryDisplayProps) {
  // Determine the main title based on whether destinationName is present and different from tripTitle
  const mainTitle = plan.destinationName 
    ? `Trip Plan for ${plan.destinationName}` 
    : plan.tripTitle;
  
  const subTitle = plan.destinationName && plan.tripTitle !== mainTitle && plan.tripTitle !== plan.destinationName
    ? `(${plan.tripTitle})`
    : null;

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-headline text-center text-primary">{mainTitle}</h2>
      {subTitle && (
        <p className="text-center text-muted-foreground text-sm -mt-4 mb-4">{subTitle}</p>
      )}

      {plan.itinerary && plan.itinerary.length > 0 && (
        <Card className="shadow-md glassmorphic-card">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <CalendarDays className="mr-3 h-6 w-6 text-accent" /> Daily Itinerary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full" defaultValue={plan.itinerary[0]?.day ? `day-${plan.itinerary[0].day.replace(/\s+/g, '-')}` : undefined}>
              {plan.itinerary.map((item, index) => (
                <AccordionItem value={`day-${item.day.replace(/\s+/g, '-')}`} key={index}>
                  <AccordionTrigger className="text-lg hover:no-underline">
                    <span className="font-semibold text-primary/90">{item.day}:</span>&nbsp;{item.title}
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 pl-2 text-sm">
                    <div>
                      <h4 className="font-semibold text-muted-foreground mb-1">Activities:</h4>
                      <p className="text-foreground/90 whitespace-pre-line">{item.activities}</p>
                    </div>
                    {item.foodSuggestions && (
                      <div>
                        <h4 className="font-semibold text-muted-foreground mb-1 flex items-center">
                          <Utensils className="mr-2 h-4 w-4 text-accent" /> Food Suggestions:
                        </h4>
                        <p className="text-foreground/90 whitespace-pre-line">{item.foodSuggestions}</p>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {plan.recommendedPlaces && (
        <Card className="shadow-md glassmorphic-card">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <MapPin className="mr-3 h-6 w-6 text-accent" /> Recommended Places
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground/90 whitespace-pre-line">{plan.recommendedPlaces}</p>
          </CardContent>
        </Card>
      )}

      {plan.travelTips && (
        <Card className="shadow-md glassmorphic-card">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <Lightbulb className="mr-3 h-6 w-6 text-accent" /> Travel Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground/90 whitespace-pre-line">{plan.travelTips}</p>
          </CardContent>
        </Card>
      )}

      {plan.estimatedCostBreakdown && (
        <Card className="shadow-md glassmorphic-card">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <DollarSign className="mr-3 h-6 w-6 text-accent" /> Estimated Cost Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground/90 whitespace-pre-line">{plan.estimatedCostBreakdown}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
