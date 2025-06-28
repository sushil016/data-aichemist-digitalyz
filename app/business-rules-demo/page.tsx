/**
 * @fileoverview Business Rules Demo Page
 * @description Showcases the business rule builder and management interface
 */

'use client';

import dynamic from 'next/dynamic';

const BusinessRuleBuilderDemo = dynamic(() => import('@/components/BusinessRuleBuilderDemo'), {
  ssr: false
});

export default function BusinessRulesPage() {
  return <BusinessRuleBuilderDemo />;
}
