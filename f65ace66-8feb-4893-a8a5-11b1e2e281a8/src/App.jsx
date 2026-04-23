import React from 'react';
import { WelcomeBanner } from './components/WelcomeBanner';
import { StatsCards } from './components/StatsCards';
import { SalesPerformance } from './components/SalesPerformance';
import { OrderStatistics } from './components/OrderStatistics';
import { OrderMonitoring } from './components/OrderMonitoring';
import { NewVendors } from './components/NewVendors';
export function App() {
  return (
    <div className="min-h-screen bg-[#f5f5f5] p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        <WelcomeBanner />
        <StatsCards />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <SalesPerformance />
          </div>
          <div className="lg:col-span-4">
            <OrderStatistics />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <OrderMonitoring />
          </div>
          <div className="lg:col-span-4">
            <NewVendors />
          </div>
        </div>
      </div>
    </div>);

}
