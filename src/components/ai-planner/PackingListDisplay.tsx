
import type { GeneratePackingListOutput } from '@/ai/flows';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox'; // Assuming you might want interactive checkboxes later
import { ScrollArea } from '@/components/ui/scroll-area';
import { Package, Shirt, Info } from 'lucide-react';

interface PackingListDisplayProps {
  list: GeneratePackingListOutput;
}

export default function PackingListDisplay({ list }: PackingListDisplayProps) {
  // Determine the main title based on whether destinationName is present and different from packingListName
  const mainTitle = list.destinationName
    ? `Packing List for ${list.destinationName}`
    : list.packingListName;

  const subTitle = list.destinationName && list.packingListName !== mainTitle && list.packingListName !== list.destinationName
    ? `(${list.packingListName})`
    : null;

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-headline text-center text-primary">{mainTitle}</h2>
      {subTitle && (
         <p className="text-center text-muted-foreground text-sm -mt-4 mb-4">{subTitle}</p>
      )}

      {list.categories && list.categories.length > 0 && (
        <Card className="shadow-md glassmorphic-card">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <Package className="mr-3 h-6 w-6 text-accent" /> What to Pack
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-3"> {/* Added ScrollArea for long lists */}
              <div className="space-y-4">
                {list.categories.map((category, catIndex) => (
                  <div key={catIndex}>
                    <h3 className="text-lg font-semibold text-primary/90 mb-2 flex items-center">
                       <Shirt className="mr-2 h-5 w-5 text-accent/80" /> {/* Placeholder, could map icons to categoryName */}
                      {category.categoryName}
                    </h3>
                    <ul className="space-y-1.5 pl-2">
                      {category.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="text-sm text-foreground/90 flex items-center">
                          {/* Basic checkbox (non-interactive for now) */}
                          {/* <Checkbox id={`item-${catIndex}-${itemIndex}`} className="mr-2 border-muted-foreground/50 data-[state=checked]:bg-accent data-[state=checked]:border-accent" /> */}
                          <span className="h-2 w-2 bg-muted-foreground/30 rounded-full mr-2.5 flex-shrink-0"></span>
                          <label htmlFor={`item-${catIndex}-${itemIndex}`}>{item}</label>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {list.additionalTips && (
        <Card className="shadow-md glassmorphic-card">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <Info className="mr-3 h-6 w-6 text-accent" /> Additional Packing Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground/90 whitespace-pre-line">{list.additionalTips}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
