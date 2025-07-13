import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import type { Product } from '@shared/schema';

interface ProductComparisonProps {
  products: Product[];
  onRemoveProduct: (productId: number) => void;
  onAddMoreProducts: () => void;
}

export function ProductComparison({ products, onRemoveProduct, onAddMoreProducts }: ProductComparisonProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Keine Produkte zum Vergleichen</h3>
        <Button onClick={onAddMoreProducts}>
          <Plus className="w-4 h-4 mr-2" />
          Produkte hinzufügen
        </Button>
      </div>
    );
  }



  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Produktvergleich</h2>
        <Button onClick={onAddMoreProducts} variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Weitere Produkte hinzufügen
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="text-left py-4 px-2 font-medium text-gray-500 border-b">Eigenschaft</th>
              {products.map((product) => (
                <th key={product.id} className="text-center py-4 px-4 border-b">
                  <Card className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white hover:bg-red-600"
                      onClick={() => onRemoveProduct(product.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    <CardHeader className="pb-2">
                      <img
                        src={product.images?.[0] || '/placeholder-product.jpg'}
                        alt={product.nameEs}
                        className="w-20 h-20 object-cover rounded mx-auto mb-2"
                      />
                      <CardTitle className="text-sm">{product.nameEs}</CardTitle>
                    </CardHeader>
                  </Card>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Basic Information */}
            <tr className="border-b">
              <td className="py-3 px-2 font-medium">Preis</td>
              {products.map((product) => (
                <td key={product.id} className="py-3 px-4 text-center">
                  {product.price ? `€${product.price}` : 'Auf Anfrage'}
                </td>
              ))}
            </tr>
            
            <tr className="border-b">
              <td className="py-3 px-2 font-medium">Verfügbarkeit</td>
              {products.map((product) => {
                // Get availability text (custom or default)
                const availabilityText = product.availabilityTextDe || 
                                       product.availabilityTextEs || 
                                       product.availabilityTextEn || 
                                       (product.stockStatus === 'in_stock' ? 'Verfügbar' : 
                                        product.stockStatus === 'out_of_stock' ? 'Nicht verfügbar' : 'Auf Bestellung');
                
                return (
                  <td key={product.id} className="py-3 px-4 text-center">
                    <Badge variant={product.stockStatus === 'in_stock' ? 'default' : 'secondary'}>
                      {availabilityText}
                    </Badge>
                  </td>
                );
              })}
            </tr>

            <tr className="border-b">
              <td className="py-3 px-2 font-medium">Beschreibung</td>
              {products.map((product) => (
                <td key={product.id} className="py-3 px-4 text-center text-sm">
                  <div className="max-w-xs">
                    {product.shortDescriptionEs?.slice(0, 100)}
                    {product.shortDescriptionEs && product.shortDescriptionEs.length > 100 && '...'}
                  </div>
                </td>
              ))}
            </tr>



            {/* Action Row */}
            <tr>
              <td className="py-4 px-2 font-medium">Aktion</td>
              {products.map((product) => (
                <td key={product.id} className="py-4 px-4 text-center">
                  <div className="space-y-2">
                    <Button size="sm" className="w-full">
                      Details ansehen
                    </Button>
                    <Button size="sm" variant="outline" className="w-full">
                      Anfrage senden
                    </Button>
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}