
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Loader2, CloudLightning } from 'lucide-react';
import { type GetWeatherSuggestionsInput, type GetWeatherSuggestionsOutput, getWeatherSuggestions } from '@/ai/flows';
import { GetWeatherSuggestionsInputSchema } from '@/ai/schemas';
import WeatherSuggestionsDisplay from './WeatherSuggestionsDisplay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function WeatherSuggestionsForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<GetWeatherSuggestionsOutput | null>(null);

  const form = useForm<GetWeatherSuggestionsInput>({
    resolver: zodResolver(GetWeatherSuggestionsInputSchema),
    defaultValues: {
      destination: '',
      date: '',
    },
  });

  async function onSubmit(values: GetWeatherSuggestionsInput) {
    setIsLoading(true);
    setSuggestions(null);
    try {
      const result = await getWeatherSuggestions(values);
      setSuggestions(result);
      toast({
        title: 'Weather Suggestions Ready!',
        description: `Suggestions for ${values.destination} around ${values.date} are below.`,
        className: 'bg-accent text-accent-foreground',
      });
    } catch (error: any) {
      console.error('Error generating weather suggestions:', error);
      toast({
        title: 'Error Generating Suggestions',
        description: error.message || 'Could not generate suggestions. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl glassmorphic-card">
      <CardHeader>
        <CardTitle className="text-2xl font-headline text-primary text-center">Weather-Based Travel Advice</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="destination"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Destination</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Pokhara, Nepal" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date or Period</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Next Monday, 2024-12-25, Mid-July" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full text-lg py-3 bg-accent hover:bg-accent/90" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <CloudLightning className="mr-2 h-5 w-5" />
              )}
              Get Weather Advice
            </Button>
          </form>
        </Form>

        {isLoading && (
          <div className="mt-8 text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <p className="mt-2 text-muted-foreground">Checking the weather patterns...</p>
          </div>
        )}

        {suggestions && !isLoading && (
          <div className="mt-8 pt-6 border-t border-border/50">
            <WeatherSuggestionsDisplay suggestions={suggestions} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
