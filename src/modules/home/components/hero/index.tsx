"use client"

import { useEffect, useState } from "react"
import CardSwap, { Card } from "@modules/common/components/card-swap"

interface CategoryCard {
  name: string;
  query: string;
  imageUrl: string;
}

const categories: Omit<CategoryCard, 'imageUrl'>[] = [
  { name: "Electronics", query: "electronics gadgets" },
  { name: "Kitchenware", query: "kitchen appliances" },
  { name: "Fashion", query: "fashion clothing" },
  { name: "Home Decor", query: "home decor interior" },
  { name: "Sports", query: "sports equipment" },
];

const Hero = () => {
  const [cards, setCards] = useState<CategoryCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const cardsWithImages = await Promise.all(
          categories.map(async (category) => {
            const response = await fetch(
              `/api/unsplash-image?query=${encodeURIComponent(category.query)}`
            );
            const data = await response.json();
            return {
              ...category,
              imageUrl: data.url || `https://via.placeholder.com/400x500/e5e7eb/6b7280?text=${encodeURIComponent(category.name)}`
            };
          })
        );
        setCards(cardsWithImages);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching images:', error);
        setCards(categories.map(cat => ({
          ...cat,
          imageUrl: `https://via.placeholder.com/400x500/e5e7eb/6b7280?text=${encodeURIComponent(cat.name)}`
        })));
        setLoading(false);
      }
    };

    fetchImages();
  }, []);

  return (
    <div className="bg-white border-b border-ui-border-base relative overflow-hidden">
      <div className="content-container py-16 md:py-24">
        <div className="max-w-xs sm:max-w-sm md:max-w-xl lg:max-w-2xl relative z-10">
          <p className="text-ui-fg-muted text-sm mb-4 tracking-wide uppercase">
            E-Commerce Recommender
          </p>
          <h1 className="text-3xl md:text-5xl font-normal text-ui-fg-base mb-4 md:mb-6 leading-tight max-w-[280px] sm:max-w-sm md:max-w-none">
            Intelligent Product Recommendations
          </h1>
          <p className="text-sm md:text-lg text-ui-fg-subtle mb-6 md:mb-8 leading-relaxed max-w-[260px] sm:max-w-xs md:max-w-lg">
            Hybrid recommendation engine with collaborative filtering and personalized explanations.
          </p>
          <div className="hidden md:flex flex-wrap gap-3 text-xs text-ui-fg-muted">
            <span className="flex items-center gap-1.5 px-3 py-1.5 border border-ui-border-base rounded-md">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
              Collaborative Filtering
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 border border-ui-border-base rounded-md">
              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
              Content-Based
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 border border-ui-border-base rounded-md">
              <span className="w-1.5 h-1.5 bg-pink-500 rounded-full"></span>
              Context-Aware
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 border border-ui-border-base rounded-md">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
              AI Explanations
            </span>
          </div>
        </div>
      </div>
      
      {/* CardSwap Animation */}
      {!loading && cards.length > 0 && (
        <div className="absolute top-0 right-0 w-full h-full z-0 pointer-events-none">
          <CardSwap
            width={300}
            height={400}
            cardDistance={40}
            verticalDistance={50}
            delay={3000}
            pauseOnHover={true}
            easing="elastic"
            skewAmount={4}
          >
            {cards.map((card, index) => (
              <Card key={index} className="overflow-hidden pointer-events-auto">
                <div className="w-full h-full relative">
                  <img
                    src={card.imageUrl}
                    alt={card.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <p className="text-white text-lg font-medium">{card.name}</p>
                  </div>
                </div>
              </Card>
            ))}
          </CardSwap>
        </div>
      )}
    </div>
  )
}

export default Hero
