
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
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { type GetLocalInsightsInput, type GetLocalInsightsOutput, getLocalInsights } from '@/ai/flows';
import { GetLocalInsightsInputSchema } from '@/ai/schemas';
import LocalInsightsDisplay from './LocalInsightsDisplay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DestinationCombobox } from './DestinationCombobox';

export default function LocalInsightsForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<GetLocalInsightsOutput | null>(null);

  const form = useForm<GetLocalInsightsInput>({
    resolver: zodResolver(GetLocalInsightsInputSchema),
    defaultValues: {
      destination: '',
    },
  });

  async function onSubmit(values: GetLocalInsightsInput) {
    setIsLoading(true);
    setInsights(null);
    try {
      const result = await getLocalInsights(values);
      setInsights(result);
      toast({
        title: 'Local Insights Generated!',
        description: `Cultural and practical tips for ${values.destination} are ready below.`,
        className: 'bg-accent text-accent-foreground',
      });
    } catch (error: any) {
      console.error('Error generating local insights:', error);
      toast({
        title: 'Error Generating Insights',
        description: error.message || 'Could not generate insights. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl glassmorphic-card">
      <CardHeader>
        <CardTitle className="text-2xl font-headline text-primary text-center">Local Insights & Cultural Tips</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="destination"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Destination (City or Country)</FormLabel>
                  <FormControl>
                     <DestinationCombobox
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select or type destination"
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
                <Search className="mr-2 h-5 w-5" />
              )}
              Get Insights
            </Button>
          </form>
        </Form>

        {isLoading && (
          <div className="mt-8 text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <p className="mt-2 text-muted-foreground">Fetching insights for you...</p>
          </div>
        )}

        {insights && !isLoading && (
          <div className="mt-8 pt-6 border-t border-border/50">
            <LocalInsightsDisplay insights={insights} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
