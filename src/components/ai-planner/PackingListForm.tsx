
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { type GeneratePackingListInput, type GeneratePackingListOutput, generatePackingList } from '@/ai/flows'; 
import { GeneratePackingListInputSchema } from '@/ai/schemas'; 
import PackingListDisplay from './PackingListDisplay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DestinationCombobox } from './DestinationCombobox';

export default function PackingListForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [packingList, setPackingList] = useState<GeneratePackingListOutput | null>(null);

  const form = useForm<GeneratePackingListInput>({
    resolver: zodResolver(GeneratePackingListInputSchema), 
    defaultValues: {
      destination: '',
      tripType: '',
      durationDays: 3,
      weather: '',
      genderContext: 'neutral',
    },
  });

  async function onSubmit(values: GeneratePackingListInput) {
    setIsLoading(true);
    setPackingList(null);
    try {
      const apiInput: GeneratePackingListInput = {
        ...values,
        durationDays: Number(values.durationDays),
      };
      const result = await generatePackingList(apiInput);
      setPackingList(result);
      toast({
        title: 'Packing List Generated!',
        description: 'Your AI-powered packing list is ready below.',
        className: 'bg-accent text-accent-foreground',
      });
    } catch (error: any) {
      console.error('Error generating packing list:', error);
      toast({
        title: 'Error Generating List',
        description: error.message || 'Could not generate packing list. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl glassmorphic-card">
      <CardHeader>
        <CardTitle className="text-2xl font-headline text-primary text-center">AI Packing List Generator</CardTitle>
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

            <FormField
              control={form.control}
              name="tripType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trip Type</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Beach vacation, Mountain trekking, City exploration" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="durationDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (Days)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 7" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))} min="1"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="weather"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expected Weather (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Sunny with chances of rain, Cold and snowy, Tropical" {...field} />
                  </FormControl>
                  <FormDescription>Helps AI tailor clothing suggestions.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="genderContext"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender Context for Clothing (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender context" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="neutral">Neutral</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full text-lg py-3 bg-accent hover:bg-accent/90" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-5 w-5" />
              )}
              Generate Packing List
            </Button>
          </form>
        </Form>

        {isLoading && (
          <div className="mt-8 text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <p className="mt-2 text-muted-foreground">Preparing your packing list...</p>
          </div>
        )}

        {packingList && !isLoading && (
          <div className="mt-8 pt-6 border-t border-border/50">
            <PackingListDisplay list={packingList} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
