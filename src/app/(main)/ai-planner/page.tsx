
'use client';

import TripPlannerForm from '@/components/ai-planner/TripPlannerForm';
import PackingListForm from '@/components/ai-planner/PackingListForm';
import LocalInsightsForm from '@/components/ai-planner/LocalInsightsForm';
import WeatherSuggestionsForm from '@/components/ai-planner/WeatherSuggestionsForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BrainCircuit, ListTodo, Globe2, CloudSun } from 'lucide-react';

export default function AiPlannerPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="pb-4 sticky top-0 z-10 bg-background/80 dark:bg-background/70 backdrop-blur-md pt-0 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8 mb-4 shadow-sm">
        <h1 className="text-2xl font-headline text-primary">AI Powered Travel Tools</h1>
        <p className="text-sm text-muted-foreground">Let AI enhance your travel planning experience.</p>
      </div>

      <ScrollArea className="flex-1">
        <div className="container mx-auto py-2 px-0 md:px-4">
          <Tabs defaultValue="trip-planner" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6 shadow-sm">
              <TabsTrigger value="trip-planner" className="py-2.5 text-sm md:text-base">
                <BrainCircuit className="mr-2 h-5 w-5" />
                Smart Trip Planner
              </TabsTrigger>
              <TabsTrigger value="packing-list" className="py-2.5 text-sm md:text-base">
                <ListTodo className="mr-2 h-5 w-5" />
                AI Packing List
              </TabsTrigger>
              <TabsTrigger value="local-insights" className="py-2.5 text-sm md:text-base">
                <Globe2 className="mr-2 h-5 w-5" />
                Local Insights
              </TabsTrigger>
              <TabsTrigger value="weather-advice" className="py-2.5 text-sm md:text-base">
                <CloudSun className="mr-2 h-5 w-5" />
                Weather Advice
              </TabsTrigger>
            </TabsList>
            <TabsContent value="trip-planner">
              <TripPlannerForm />
            </TabsContent>
            <TabsContent value="packing-list">
              <PackingListForm />
            </TabsContent>
            <TabsContent value="local-insights">
              <LocalInsightsForm />
            </TabsContent>
            <TabsContent value="weather-advice">
              <WeatherSuggestionsForm />
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
}
