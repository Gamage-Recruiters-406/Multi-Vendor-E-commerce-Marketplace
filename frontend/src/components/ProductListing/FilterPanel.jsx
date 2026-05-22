import { useState, useCallback } from 'react';

const GREEN = '#1A9F73';
const GREEN_DARK = '#158860';

function Stars({ rating }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => {
        const full = i <= Math.floor(rating);
        return (
          <svg key={i} width="14" height="14" viewBox="0 0 20 20">
            <path
              d="M10 1l2.39 4.84 5.34.78-3.86 3.76.91 5.32L10 13.27l-4.78 2.51.91-5.32L2.27 6.62l5.34-.78L10 1z"
              fill={full ? '#f59e0b' : '#d1d5db'}
            />
          </svg>
        );
      })}
    </div>
  );
}

const CheckIcon = ({ size = 12 }) => (
  <svg width={size} height={size} fill="none" stroke="white" strokeWidth={3} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

export default function FilterPanel({ 
  onClose, 
  filters,
  onFilterChange,
  onApplyFilters,
  onResetFilters,
  categories = []
}) {
  // Initialize localFilters with proper values from props - no effect needed
  const [localFilters, setLocalFilters] = useState({
    priceMin: filters?.priceMin !== undefined ? filters.priceMin : (filters?.priceRange?.min || 0),
    priceMax: filters?.priceMax !== undefined ? filters.priceMax : (filters?.priceRange?.max || 1000),
    selectedCategories: filters?.selectedCategories || [],
    priceRange: filters?.priceRange || { min: 0, max: 1000 }
  });

  const handlePriceMinChange = useCallback((value) => {
    const numValue = parseFloat(value);
    const minBoundary = localFilters.priceRange?.min || 0;
    const maxBoundary = localFilters.priceRange?.max || 1000;
    const maxValue = localFilters.priceMax || maxBoundary;
    
    let newValue = Math.max(minBoundary, Math.min(numValue, maxValue - 1));
    if (isNaN(newValue)) newValue = minBoundary;
    
    setLocalFilters(prev => ({
      ...prev,
      priceMin: newValue
    }));
  }, [localFilters.priceRange?.min, localFilters.priceRange?.max, localFilters.priceMax]);

  const handlePriceMaxChange = useCallback((value) => {
    const numValue = parseFloat(value);
    const minBoundary = localFilters.priceRange?.min || 0;
    const maxBoundary = localFilters.priceRange?.max || 1000;
    const minValue = localFilters.priceMin || minBoundary;
    
    let newValue = Math.min(maxBoundary, Math.max(numValue, minValue + 1));
    if (isNaN(newValue)) newValue = maxBoundary;
    
    setLocalFilters(prev => ({
      ...prev,
      priceMax: newValue
    }));
  }, [localFilters.priceRange?.min, localFilters.priceRange?.max, localFilters.priceMin]);

  const toggleCategory = useCallback((cat) => {
    setLocalFilters(prev => ({
      ...prev,
      selectedCategories: prev.selectedCategories?.includes(cat)
        ? prev.selectedCategories.filter(c => c !== cat)
        : [...(prev.selectedCategories || []), cat]
    }));
  }, []);

  const handleReset = useCallback(() => {
    const resetFilters = {
      priceMin: filters?.priceRange?.min || 0,
      priceMax: filters?.priceRange?.max || 1000,
      selectedCategories: [],
      priceRange: filters?.priceRange || { min: 0, max: 1000 }
    };
    setLocalFilters(resetFilters);
    if (onResetFilters) {
      onResetFilters();
    }
  }, [filters?.priceRange, onResetFilters]);

  const handleApply = useCallback(() => {
    if (!localFilters) return;
    
    const cleanedFilters = {
      ...localFilters,
      priceMin: Number(localFilters.priceMin),
      priceMax: Number(localFilters.priceMax)
    };
    if (onFilterChange) {
      onFilterChange(cleanedFilters);
    }
    if (onApplyFilters) {
      onApplyFilters(cleanedFilters);
    }
  }, [localFilters, onFilterChange, onApplyFilters]);

  const displayCategories = categories?.length > 0 ? categories : [];

  const minBoundary = localFilters?.priceRange?.min || 0;
  const maxBoundary = localFilters?.priceRange?.max || 1000;
  const currentMin = localFilters?.priceMin !== undefined ? localFilters.priceMin : minBoundary;
  const currentMax = localFilters?.priceMax !== undefined ? localFilters.priceMax : maxBoundary;

  const minPercent = ((currentMin - minBoundary) / (maxBoundary - minBoundary)) * 100;
  const maxPercent = ((currentMax - minBoundary) / (maxBoundary - minBoundary)) * 100;

  return (
    <aside style={{
      width: '100%',
      maxWidth: 280,
      flexShrink: 0, 
      background: 'white',
      border: '1px solid #e5e7eb', 
      borderRadius: 14,
      padding: 20, 
      alignSelf: 'flex-start', 
      position: 'sticky', 
      top: 16,
      height: 'auto',
      maxHeight: 'calc(100vh - 100px)',
      overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button 
            onClick={onClose} 
            style={{ 
              background: 'none', border: 'none', 
              color: '#9ca3af', fontSize: 18, 
              cursor: 'pointer', padding: 0
            }}
            aria-label="Close filters"
          >
            ✕
          </button>
          <span style={{ fontWeight: 700, color: '#1f2937', fontSize: 16 }}>Filters</span>
        </div>
        <button 
          onClick={handleReset} 
          style={{ 
            background: 'none', border: 'none', 
            color: GREEN, fontSize: 13, fontWeight: 500, 
            cursor: 'pointer'
          }}
        >
          Reset all
        </button>
      </div>

      {/* Price Range Section */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 12 }}>
          Price Range
        </p>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: '#6b7280' }}>${currentMin}</span>
          <span style={{ fontSize: 12, color: '#6b7280' }}>${currentMax}</span>
        </div>
        
        <div style={{ position: 'relative', height: 20, marginBottom: 16 }}>
          <div style={{ 
            width: '100%', height: 4, 
            background: '#e5e7eb', borderRadius: 999, 
            position: 'relative', top: 8 
          }}>
            <div style={{
              position: 'absolute', height: '100%', background: GREEN, borderRadius: 999,
              left: `${minPercent}%`,
              right: `${100 - maxPercent}%`
            }} />
          </div>
          
          <input 
            type="range" 
            min={minBoundary} 
            max={maxBoundary} 
            value={currentMin}
            onChange={e => handlePriceMinChange(e.target.value)}
            style={{ 
              position: 'absolute', width: '100%', 
              background: 'transparent', zIndex: 2, top: 0,
              touchAction: 'pan-y'
            }}
            aria-label="Minimum price"
          />
          <input 
            type="range" 
            min={minBoundary} 
            max={maxBoundary} 
            value={currentMax}
            onChange={e => handlePriceMaxChange(e.target.value)}
            style={{ 
              position: 'absolute', width: '100%', 
              background: 'transparent', zIndex: 3, top: 0,
              touchAction: 'pan-y'
            }}
            aria-label="Maximum price"
          />
        </div>
        
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 10, color: '#9ca3af', marginBottom: 4 }}>MIN PRICE</p>
            <div style={{ 
              border: '1px solid #e5e7eb', borderRadius: 8, 
              padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 4 
            }}>
              <span style={{ color: '#9ca3af' }}>$</span>
              <input 
                type="number" 
                value={currentMin} 
                onChange={e => handlePriceMinChange(e.target.value)}
                style={{ 
                  width: '100%', border: 'none', outline: 'none', 
                  fontSize: 13, color: '#1f2937'
                }} 
                aria-label="Minimum price input"
              />
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 10, color: '#9ca3af', marginBottom: 4 }}>MAX PRICE</p>
            <div style={{ 
              border: '1px solid #e5e7eb', borderRadius: 8, 
              padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 4 
            }}>
              <span style={{ color: '#9ca3af' }}>$</span>
              <input 
                type="number" 
                value={currentMax} 
                onChange={e => handlePriceMaxChange(e.target.value)}
                style={{ 
                  width: '100%', border: 'none', outline: 'none', 
                  fontSize: 13, color: '#1f2937'
                }} 
                aria-label="Maximum price input"
              />
            </div>
          </div>
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #f3f4f6', margin: '16px 0' }} />

      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 12 }}>
          Categories
        </p>
        {displayCategories.length === 0 ? (
          <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', padding: '12px 0' }}>
            Loading categories...
          </p>
        ) : (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 10,
            maxHeight: 300,
            overflowY: 'auto',
            overflowX: 'hidden',
            paddingRight: 8,
            scrollbarWidth: 'thin',
            scrollbarColor: `${GREEN} #f0f0f0`,
            WebkitOverflowScrolling: 'touch',
          }}
          className="custom-scrollbar"
          >
            {displayCategories.map(cat => (
              <label 
                key={cat} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  cursor: 'pointer',
                  padding: '6px 0',
                  minHeight: 32,
                  flexShrink: 0
                }}
              >
                <span style={{ fontSize: 13, color: '#374151', marginRight: 12 }}>{cat}</span>
                <div 
                  onClick={() => toggleCategory(cat)} 
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `2px solid ${localFilters?.selectedCategories?.includes(cat) ? GREEN : '#d1d5db'}`,
                    background: localFilters?.selectedCategories?.includes(cat) ? GREEN : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    flexShrink: 0
                  }}
                >
                  {localFilters?.selectedCategories?.includes(cat) && <CheckIcon size={10} />}
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <button 
          onClick={handleReset} 
          style={{
            flex: 1, padding: '10px 0', background: 'white',
            border: '1px solid #e5e7eb', borderRadius: 8,
            fontSize: 13, fontWeight: 500, color: '#4b5563',
            cursor: 'pointer', transition: 'all 0.15s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
          onMouseLeave={e => e.currentTarget.style.background = 'white'}
        >
          Clear All
        </button>
        <button 
          onClick={handleApply} 
          style={{
            flex: 1, padding: '10px 0', background: GREEN,
            border: 'none', borderRadius: 8, fontSize: 13,
            fontWeight: 600, color: 'white', cursor: 'pointer',
            transition: 'background 0.15s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = GREEN_DARK}
          onMouseLeave={e => e.currentTarget.style.background = GREEN}
        >
          Apply Filters
        </button>
      </div>

      <style>{`
        input[type='range'] {
          -webkit-appearance: none;
          height: 100%;
          cursor: pointer;
        }
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: ${GREEN};
          border: 2px solid white;
          box-shadow: 0 1px 4px rgba(0,0,0,0.2);
          cursor: pointer;
          margin-top: -6px;
        }
        input[type='range']::-webkit-slider-runnable-track {
          height: 4px;
          background: transparent;
        }
        input[type='number']::-webkit-inner-spin-button,
        input[type='number']::-webkit-outer-spin-button {
          opacity: 0.5;
        }
        
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: ${GREEN} #e5e7eb;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #e5e7eb;
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${GREEN};
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${GREEN_DARK};
        }
        
        @media (max-width: 768px) {
          .custom-scrollbar {
            max-height: 400px;
          }
          
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          
          input[type='range']::-webkit-slider-thumb {
            width: 20px;
            height: 20px;
            margin-top: -8px;
          }
        }
      `}</style>
    </aside>
  );
}