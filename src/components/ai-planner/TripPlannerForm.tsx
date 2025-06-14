
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Loader2, Wand2, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { type PlanTripInput, type PlanTripOutput, planTrip } from '@/ai/flows';
import { PlanTripInputSchema } from '@/ai/schemas';
import ItineraryDisplay from './ItineraryDisplay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DestinationCombobox } from './DestinationCombobox';

export default function TripPlannerForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [tripPlan, setTripPlan] = useState<PlanTripOutput | null>(null);

  const form = useForm<PlanTripInput>({ 
    resolver: zodResolver(PlanTripInputSchema),
    defaultValues: {
      destination: '',
      startDate: null,
      endDate: null,
      numberOfDays: undefined,
      budget: '',
      interests: '',
      numberOfPeople: 1,
    },
  });

  async function onSubmit(values: PlanTripInput) {
    setIsLoading(true);
    setTripPlan(null);
    try {
      const apiInput: PlanTripInput = {
        ...values,
        numberOfDays: values.numberOfDays ? Number(values.numberOfDays) : undefined,
        numberOfPeople: values.numberOfPeople ? Number(values.numberOfPeople) : 1,
      };

      const result = await planTrip(apiInput);
      setTripPlan(result);
      toast({
        title: 'Trip Plan Generated!',
        description: 'Your AI-powered itinerary is ready below.',
        className: 'bg-accent text-accent-foreground',
      });
    } catch (error: any) {
      console.error('Error generating trip plan:', error);
      toast({
        title: 'Error Generating Plan',
        description: error.message || 'Could not generate trip plan. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl glassmorphic-card">
      <CardHeader>
        <CardTitle className="text-2xl font-headline text-primary text-center">AI Smart Trip Planner</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="destination"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Destination</FormLabel>
                  <FormControl>
                    <DestinationCombobox
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select a destination"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date (Optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          captionLayout="dropdown-buttons" fromYear={new Date().getFullYear() -1} toYear={new Date().getFullYear() + 5}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date (Optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            form.getValues("startDate") ? date < form.getValues("startDate")! : false
                          }
                          captionLayout="dropdown-buttons" fromYear={new Date().getFullYear() -1} toYear={new Date().getFullYear() + 5}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="numberOfDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Days (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="e.g., 5" 
                      {...field} 
                      value={field.value ?? ''} 
                      onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))} 
                      min="1"
                    />
                  </FormControl>
                  <FormDescription>If dates are provided, AI can infer this.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="budget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., NPR 20000, $500, Moderate, Luxury" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="interests"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interests</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., hiking, local food, museums, photography, adventure, relaxation, cultural immersion" {...field} />
                  </FormControl>
                  <FormDescription>Comma-separated list of your interests.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="numberOfPeople"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of People</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="e.g., 2" 
                      {...field} 
                      value={field.value ?? ''} 
                      onChange={e => field.onChange(e.target.value === '' ? 1 : parseInt(e.target.value, 10) || 1)} 
                      min="1" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full text-lg py-3 bg-accent hover:bg-accent/90" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Wand2 className="mr-2 h-5 w-5" />
              )}
              Generate Trip Plan
            </Button>
          </form>
        </Form>

        {isLoading && (
          <div className="mt-8 text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <p className="mt-2 text-muted-foreground">Crafting your adventure... this might take a moment!</p>
          </div>
        )}

        {tripPlan && !isLoading && (
          <div className="mt-8 pt-6 border-t border-border/50">
            <ItineraryDisplay plan={tripPlan} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
