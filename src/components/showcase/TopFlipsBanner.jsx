import React from 'react';
import { Card } from "@/components/ui/card";
import { Award, Zap, TrendingUp, Trophy } from 'lucide-react';

const MedalCard = ({ medal, title, value, itemName, onSelect }) => {
    const medalConfig = {
        'gold': { icon: Award, color: 'from-amber-400 to-yellow-500' },
        'silver': { icon: Zap, color: 'from-gray-400 to-slate-500' },
        'bronze': { icon: TrendingUp, color: 'from-orange-500 to-amber-600' }
    };
    const { icon: Icon, color } = medalConfig[medal];

    if (!itemName) return null;

    return (
        <Card 
            onClick={onSelect} 
            className={`overflow-hidden border-0 bg-gradient-to-br ${color} text-white shadow-md hover:shadow-lg transition-all cursor-pointer`}
        >
            <div className="p-3">
                <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold truncate">{title}</p>
                        <p className="text-base font-bold truncate">{value}</p>
                    </div>
                </div>
                <p className="text-[10px] truncate opacity-90">{itemName}</p>
            </div>
        </Card>
    );
};

export default function TopFlipsBanner({ topFlips, onSelectFlip }) {
    if (!topFlips.highestProfit && !topFlips.fastestSale && !topFlips.highestRoi) return null;
    
    return (
        <div className="mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500 flex-shrink-0"/>
                <span>Top Flips This Month</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <MedalCard
                    medal="gold"
                    title="Best Profit"
                    value={`$${topFlips.highestProfit?.profit.toFixed(0)}`}
                    itemName={topFlips.highestProfit?.item_name}
                    onSelect={() => onSelectFlip(topFlips.highestProfit)}
                />
                <MedalCard
                    medal="silver"
                    title="Fastest Sale"
                    value={`${topFlips.fastestSale?.saleSpeed}d`}
                    itemName={topFlips.fastestSale?.item_name}
                    onSelect={() => onSelectFlip(topFlips.fastestSale)}
                />
                <MedalCard
                    medal="bronze"
                    title="Highest ROI"
                    value={isFinite(topFlips.highestRoi?.roi) ? `${topFlips.highestRoi?.roi.toFixed(0)}%` : '∞%'}
                    itemName={topFlips.highestRoi?.item_name}
                    onSelect={() => onSelectFlip(topFlips.highestRoi)}
                />
            </div>
        </div>
    );
}