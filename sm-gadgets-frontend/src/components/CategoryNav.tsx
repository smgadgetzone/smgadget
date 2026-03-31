import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BatteryCharging, Headphones, Watch, Flame, MonitorSmartphone, Gamepad2 } from 'lucide-react';

const categories = [
  { id: 'chargers', name: 'Chargers', icon: BatteryCharging, path: '/shop?category=chargers' },
  { id: 'headphones', name: 'Headphones', icon: Headphones, path: '/shop?category=headphones' },
  { id: 'smart-watches', name: 'Smart Watches', icon: Watch, path: '/shop?category=smart-watches' },
  { id: 'viral', name: 'Viral Gadgets', icon: Flame, path: '/shop?category=viral' },
  { id: 'electronics-devices', name: 'Electronics Devices', icon: MonitorSmartphone, path: '/shop?category=electronics-devices' },
  { id: 'toys', name: 'Toys', icon: Gamepad2, path: '/shop?category=toys' }
];

const CategoryNav = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const currentCategory = searchParams.get('category');

  return (
    <div className="w-full bg-background border-b border-white/10 shadow-md overflow-x-auto no-scrollbar">
      <div className="container mx-auto px-2 md:px-4">
        <ul className="flex items-center justify-start md:justify-center min-w-max gap-6 md:gap-12 py-3 px-2">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = currentCategory === cat.id;
            return (
              <li key={cat.id}>
                <Link 
                  to={cat.path}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300 hover:bg-white/5 ${isActive ? 'text-primary scale-105' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <Icon className="w-6 h-6 mb-1.5" strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-[11px] md:text-xs font-semibold whitespace-nowrap tracking-wide">{cat.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default CategoryNav;
