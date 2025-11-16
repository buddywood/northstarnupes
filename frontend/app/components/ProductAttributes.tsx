'use client';

import { useEffect, useState } from 'react';
import { fetchCategoryAttributeDefinitions } from '@/lib/api';
import type { Product, CategoryAttributeDefinition, ProductAttributeValue } from '@/lib/api';

interface ProductAttributesProps {
  product: Product;
}

export default function ProductAttributes({ product }: ProductAttributesProps) {
  const [attributeDefinitions, setAttributeDefinitions] = useState<CategoryAttributeDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (product.category_id) {
      fetchCategoryAttributeDefinitions(product.category_id)
        .then(setAttributeDefinitions)
        .catch((err) => {
          console.error('Error fetching attribute definitions:', err);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [product.category_id]);

  if (!product.category_id || loading) {
    return null;
  }

  if (attributeDefinitions.length === 0) {
    return null;
  }

  // Create a map of attribute values by definition ID for quick lookup
  const attributeValueMap = new Map<number, ProductAttributeValue>();
  if (product.attributes) {
    product.attributes.forEach((attr) => {
      attributeValueMap.set(attr.attribute_definition_id, attr);
    });
  }

  // Match definitions with their values and filter to only show attributes that have values
  const attributesWithValues = attributeDefinitions
    .map((def) => {
      const value = attributeValueMap.get(def.id);
      return { definition: def, value };
    })
    .filter((item) => {
      // Only show if there's a value and it's not empty
      if (!item.value) return false;
      if (item.definition.attribute_type === 'TEXT' && !item.value.value_text) return false;
      if (item.definition.attribute_type === 'NUMBER' && item.value.value_number === null) return false;
      if (item.definition.attribute_type === 'BOOLEAN' && item.value.value_boolean === null) return false;
      return true;
    });

  if (attributesWithValues.length === 0) {
    return null;
  }

  const getDisplayValue = (def: CategoryAttributeDefinition, value: ProductAttributeValue | undefined): string => {
    if (!value) return '';
    
    if (def.attribute_type === 'BOOLEAN') {
      return value.value_boolean ? 'Yes' : 'No';
    }
    if (def.attribute_type === 'NUMBER') {
      return value.value_number?.toString() || '';
    }
    if (def.attribute_type === 'SELECT') {
      return value.value_text || '';
    }
    return value.value_text || '';
  };

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold text-midnight-navy dark:text-gray-100 mb-4">Product Details</h3>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {attributesWithValues.map(({ definition, value }) => (
          <div key={definition.id} className="border-b border-frost-gray/30 dark:border-gray-800/30 pb-3">
            <dt className="text-sm font-medium text-midnight-navy/70 dark:text-gray-400 mb-1">
              {definition.attribute_name}
            </dt>
            <dd className="text-base text-midnight-navy dark:text-gray-200 font-medium">
              {getDisplayValue(definition, value)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

