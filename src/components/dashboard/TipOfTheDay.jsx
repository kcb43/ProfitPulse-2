import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";

const tips = [
  "Remember: Price high, offer low, and flip like you mean it.",
  "The best source is often the one nobody else is looking at.",
  "Clean items sell faster. A little elbow grease goes a long way.",
  "Great photos are your best salesperson. Use natural light.",
  "Patience is a virtue in sourcing, but speed is a key in listing.",
  "Know your numbers. Profit isn't just selling price minus purchase price.",
  "Don't get emotionally attached to your inventory. It's business, not a museum.",
  "A good deal today is better than a perfect deal tomorrow.",
  "Bundle related items to increase the value of your sale.",
  "Always check for flaws and disclose them honestly in your listings.",
  "Cross-list your items on multiple platforms to maximize visibility."
];

export default function TipOfTheDay() {
  const [tip, setTip] = useState("");

  useEffect(() => {
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    setTip(randomTip);
  }, []);

  return (
    <Card className="border-0 shadow-sm bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 h-full">
      <CardContent className="p-6 flex items-start gap-4">
        <Lightbulb className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mt-1 flex-shrink-0" />
        <div>
          <p className="font-semibold text-yellow-900 dark:text-yellow-200">Tip of the Day</p>
          <p className="text-sm text-yellow-800 dark:text-yellow-300 mt-1">"{tip}"</p>
        </div>
      </CardContent>
    </Card>
  );
}