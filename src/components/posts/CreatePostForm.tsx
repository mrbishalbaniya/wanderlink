
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import InteractiveMap from '@/components/map/InteractiveMap';
import type { LatLng, LatLngTuple } from 'leaflet';
import type { PostCategory, TripStatus } from '@/types';
import { Loader2, UploadCloud, XCircle, Pin, Calendar as CalendarIcon, ListChecks } from 'lucide-react'; 
import Image from 'next/image';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';

const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE_MB = 5;

const formSchema = z.object({
  title: z.string().min(5, { message: 'Title must be at least 5 characters.' }).max(100),
  caption: z.string().min(10, { message: 'Caption must be at least 10 characters.' }).max(1000), 
  locationLabel: z.string().max(100, { message: 'Location label must be at most 100 characters.'}).optional(), 
  category: z.enum(['hiking', 'city', 'beach', 'food', 'culture', 'nature', 'other']),
  tripStartDate: z.date().optional().nullable(),
  tripEndDate: z.date().optional().nullable(),
  packingList: z.string().max(2000, "Packing list is too long.").optional(),
}).refine(data => {
  if (data.tripStartDate && data.tripEndDate && data.tripEndDate < data.tripStartDate) {
    return false;
  }
  return true;
}, {
  message: "Trip end date cannot be before start date.",
  path: ["tripEndDate"],
});

export default function CreatePostForm() {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const router = useRouter();
  const [selectedLocation, setSelectedLocation] = useState<LatLngTuple | undefined>(undefined);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      caption: '', 
      locationLabel: '', 
      category: 'other',
      tripStartDate: null,
      tripEndDate: null,
      packingList: '',
    },
  });

  useEffect(() => {
    return () => {
      imagePreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

  const handleMapClick = useCallback((latlng: LatLng) => {
    setSelectedLocation([latlng.lat, latlng.lng]);
  }, []);

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const filesArray = Array.from(event.target.files);
      const newImages: File[] = [];
      const newPreviews: string[] = [];

      for (const file of filesArray) {
        if (images.length + newImages.length >= MAX_IMAGES) {
          toast({ title: "Limit Reached", description: `You can upload a maximum of ${MAX_IMAGES} images.`, variant: "destructive" });
          break;
        }
        if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
          toast({ title: "File Too Large", description: `${file.name} exceeds ${MAX_IMAGE_SIZE_MB}MB limit.`, variant: "destructive" });
          continue;
        }
        
        newImages.push(file);
        newPreviews.push(URL.createObjectURL(file));
      }

      setImages(prev => [...prev, ...newImages]);
      setImagePreviews(prev => [...prev, ...newPreviews]);
      
      event.target.value = ''; 
    }
  };
  
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => {
      const urlToRemove = prev[index];
      URL.revokeObjectURL(urlToRemove);
      return prev.filter((_, i) => i !== index);
    });
  };

  const uploadImageToCloudinary = async (file: File): Promise<string> => {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      console.error("[uploadImageToCloudinary] Cloudinary environment variables not set during function call.");
      throw new Error("Cloudinary configuration is missing.");
    }
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );
    const data = await response.json();
    if (data.secure_url) {
      return data.secure_url;
    } else {
      console.error("[Cloudinary] Upload failed:", data.error?.message || data);
      throw new Error(data.error?.message || 'Cloudinary upload failed');
    }
  };


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!currentUser) {
      toast({ title: 'Authentication Required', description: 'Please login to create a post.', variant: 'destructive' });
      return;
    }
    if (!selectedLocation) {
      toast({ title: 'Location Required', description: 'Please select a location on the map.', variant: 'destructive' });
      return;
    }

    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      toast({ title: 'Configuration Error', description: 'Cloudinary is not configured. Please check environment variables and contact support.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);

    try {
      const imageUrls: string[] = [];
      if (images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          const image = images[i];
          const downloadURL = await uploadImageToCloudinary(image);
          imageUrls.push(downloadURL);
        }
      }

      const postData = {
        userId: currentUser.uid,
        title: values.title,
        caption: values.caption, 
        locationLabel: values.locationLabel || null, 
        coordinates: { latitude: selectedLocation[0], longitude: selectedLocation[1] },
        category: values.category as PostCategory,
        images: imageUrls,
        createdAt: serverTimestamp(),
        likes: [],
        savedBy: [],
        commentCount: 0,
        // New trip fields
        tripStatus: 'upcoming' as TripStatus,
        tripStartDate: values.tripStartDate ? Timestamp.fromDate(values.tripStartDate) : null,
        tripEndDate: values.tripEndDate ? Timestamp.fromDate(values.tripEndDate) : null,
        participants: [currentUser.uid],
        packingList: values.packingList || null,
        lastUpdated: serverTimestamp(),
      };
      
      await addDoc(collection(db, 'posts'), postData);

      toast({ title: 'Post Created!', description: 'Your travel post has been successfully shared.' });
      router.push('/'); // Or perhaps to /upcoming
    } catch (error: any) {
      console.error('[CreatePostForm] Error during post creation:', error);
      toast({
        title: 'Error Creating Post',
        description: `An error occurred: ${error.message || 'Could not create post. Please try again.'}`,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="font-headline text-4xl text-primary mb-8 text-center">Share Your Adventure</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Hiking the Swiss Alps" {...field} className="text-base"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="locationLabel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg flex items-center">
                      <Pin className="h-5 w-5 mr-2 text-muted-foreground" />
                      Location Name (Optional)
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Eiffel Tower, Paris or Serene Beach Getaway" {...field} className="text-base"/>
                    </FormControl>
                    <FormDescription>A descriptive name for the location of your post.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="caption"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">Caption</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Share details about your amazing experience..." {...field} rows={4} className="text-base"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="text-base">
                          <SelectValue placeholder="Select a travel category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(['hiking', 'city', 'beach', 'food', 'culture', 'nature', 'other'] as PostCategory[]).map(cat => (
                          <SelectItem key={cat} value={cat} className="text-base">
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField control={form.control} name="tripStartDate" render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-lg">Trip Start Date (Optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant={"outline"} className={`w-full justify-start text-left font-normal ${!field.value && "text-muted-foreground"}`}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "PPP") : <span>Pick a start date</span>}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="tripEndDate" render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-lg">Trip End Date (Optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant={"outline"} className={`w-full justify-start text-left font-normal ${!field.value && "text-muted-foreground"}`}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "PPP") : <span>Pick an end date</span>}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => form.getValues("tripStartDate") ? date < form.getValues("tripStartDate")! : false} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )} />
                 <FormField
                  control={form.control}
                  name="packingList"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg flex items-center">
                        <ListChecks className="h-5 w-5 mr-2 text-muted-foreground" />
                        Packing List (Optional)
                      </FormLabel>
                      <FormControl>
                        <Textarea placeholder="e.g., Hiking boots, Sunscreen, Water bottle..." {...field} rows={4} className="text-base"/>
                      </FormControl>
                       <FormDescription>One item per line is recommended.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
            <div className="space-y-6">
              <div>
                <FormLabel className="text-lg">Pin Location on Map</FormLabel>
                <FormDescription>Click on the map to select the precise location of your post.</FormDescription>
                <InteractiveMap 
                  onMapClick={handleMapClick} 
                  selectedLocation={selectedLocation}
                  className="h-[300px] md:h-[calc(100%-110px)] min-h-[300px] w-full mt-2 rounded-lg shadow-md" 
                />
                {selectedLocation && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Selected: Lat: {selectedLocation[0].toFixed(4)}, Lng: {selectedLocation[1].toFixed(4)}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div>
            <FormLabel className="text-lg">Images (up to {MAX_IMAGES})</FormLabel>
            <FormControl className="mt-2">
              <div className="flex items-center justify-center w-full">
                <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                        <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-muted-foreground">PNG, JPG, GIF (MAX. {MAX_IMAGE_SIZE_MB}MB each)</p>
                    </div>
                    <Input id="dropzone-file" type="file" className="hidden" onChange={handleImageChange} multiple accept="image/*" />
                </label>
              </div>
            </FormControl>
            {imagePreviews.length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {imagePreviews.map((previewUrl, index) => (
                  <div key={index} className="relative group">
                    <Image src={previewUrl} alt={`Preview ${index}`} width={150} height={150} className="rounded-md object-cover aspect-square" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(index)}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Create Post'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

