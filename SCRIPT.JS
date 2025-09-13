// Global Variables
let currentTripData = {};
let mapInstance = null;
let markers = [];

// Predefined data for better user experience
const DESTINATIONS = {
    domestic: [
        'Goa', 'Manali', 'Udaipur', 'Jaipur', 'Kerala', 'Shimla', 'Darjeeling', 
        'Rishikesh', 'Agra', 'Varanasi', 'Mumbai', 'Delhi', 'Bangalore', 'Mysore'
    ],
    international: [
        'Paris', 'London', 'Tokyo', 'New York', 'Dubai', 'Thailand', 'Singapore', 
        'Bali', 'Rome', 'Barcelona', 'Amsterdam', 'Sydney', 'Hong Kong', 'Seoul'
    ]
};

const BUDGET_BREAKDOWN = {
    domestic: {
        accommodation: 35,
        food: 25,
        transport: 20,
        activities: 15,
        shopping: 5
    },
    international: {
        accommodation: 40,
        food: 20,
        transport: 25,
        activities: 10,
        shopping: 5
    }
};

// Detailed budget breakdown for each category
const DETAILED_EXPENSES = {
    accommodation: {
        'Budget Hotels/Hostels': 0.4,
        'Mid-range Hotels': 0.35,
        'Service Charges & Tips': 0.15,
        'Booking Platform Fees': 0.1
    },
    food: {
        'Local Restaurants': 0.5,
        'Street Food & Snacks': 0.2,
        'Fine Dining': 0.2,
        'Beverages & Drinks': 0.1
    },
    transport: {
        'Flight/Train Tickets': 0.6,
        'Local Transport': 0.25,
        'Taxi/Auto Fares': 0.15
    },
    activities: {
        'Sightseeing Tours': 0.4,
        'Adventure Activities': 0.3,
        'Museum/Monument Entries': 0.2,
        'Entertainment': 0.1
    },
    shopping: {
        'Local Handicrafts': 0.4,
        'Clothing & Accessories': 0.35,
        'Souvenirs': 0.25
    }
};

const TRAVEL_TIPS = {
    'goa': {
        budgetFriendly: [
            'Visit free beaches like Arambol and Vagator',
            'Use local buses instead of taxis',
            'Eat at beach shacks for authentic food',
            'Stay in hostels or guesthouses',
            'Rent a scooter for local transport'
        ],
        avoid: [
            'Expensive beach clubs in South Goa',
            'Tourist trap restaurants near hotels',
            'Overpriced water sports at popular beaches',
            'Shopping at airport or hotel stores'
        ]
    },
    'manali': {
        budgetFriendly: [
            'Trek to free viewpoints like Jogini Falls',
            'Use local buses for Rohtang Pass',
            'Stay in Old Manali for cheaper options',
            'Visit Hadimba Temple (free entry)',
            'Explore local markets for souvenirs'
        ],
        avoid: [
            'Peak season hotel rates (May-June)',
            'Expensive adventure sports packages',
            'Tourist taxi services',
            'Restaurants on Mall Road'
        ]
    },
    'udaipur': {
        budgetFriendly: [
            'Walk around City Palace area',
            'Take boat rides in evening for better rates',
            'Stay in heritage budget hotels',
            'Visit Saheliyon ki Bari garden',
            'Explore local markets'
        ],
        avoid: [
            'Luxury palace hotels without booking',
            'Tourist restaurants near Lake Pichola',
            'Expensive evening cultural shows',
            'High-end handicraft stores'
        ]
    },
    'paris': {
        budgetFriendly: [
            'Visit free museums on first Sunday',
            'Use public transport with weekly passes',
            'Picnic in parks with local food',
            'Walk along Seine river',
            'Visit free attractions like Sacré-Cœur'
        ],
        avoid: [
            'Tourist restaurants near Eiffel Tower',
            'Expensive Seine river dinner cruises',
            'Shopping on Champs-Élysées',
            'Hotel breakfast (expensive)'
        ]
    },
    'london': {
        budgetFriendly: [
            'Visit free museums like British Museum',
            'Use Oyster card for transport',
            'Explore free parks and markets',
            'Watch street performances',
            'Take free walking tours'
        ],
        avoid: [
            'Peak season hotel rates',
            'Tourist pubs near attractions',
            'West End show premium seats',
            'Airport transport (expensive)'
        ]
    },
    'tokyo': {
        budgetFriendly: [
            'Use JR Pass for unlimited train travel',
            'Eat at local ramen shops',
            'Visit free temples and gardens',
            'Shop at 100 yen stores',
            'Stay in capsule hotels or hostels'
        ],
        avoid: [
            'Expensive sushi restaurants in Ginza',
            'Peak season accommodation',
            'Tourist trap restaurants',
            'Expensive department stores'
        ]
    }
};

// DOM Elements
const form = document.getElementById('plannerForm');
const loadingSection = document.getElementById('loading');
const resultsSection = document.getElementById('results');
const chatbotWindow = document.getElementById('chatbot-window');
const chatbotMessages = document.getElementById('chatbot-messages');
const chatbotInput = document.getElementById('chatbot-input');
const toast = document.getElementById('toast');

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    form.addEventListener('submit', handleFormSubmit);
    
    // Add loading animation to form elements
    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            if (this.parentElement) this.parentElement.style.transform = 'translateY(-2px)';
        });
        
        input.addEventListener('blur', function() {
            if (this.parentElement) this.parentElement.style.transform = 'translateY(0)';
        });
    });
});

// Form Submission Handler
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(form);
    const tripData = {
        budget: parseInt(formData.get('budget')),
        days: parseInt(formData.get('days')),
        destination: formData.get('destination').trim(),
        travelType: formData.get('travelType')
    };

    currentTripData = tripData;
    
    showLoading();
    
    try {
        await generateTravelPlan(tripData);
        showResults();
    } catch (error) {
        console.error('Error generating travel plan:', error);
        showToast('❌ Error generating travel plan. Please try again!');
        hideLoading();
    }
}

// Show Loading State
function showLoading() {
    const travelFormEl = document.getElementById('travel-form');
    if (travelFormEl) travelFormEl.style.display = 'none';
    if (loadingSection) {
        loadingSection.classList.remove('loading-hidden');
        loadingSection.style.display = 'block';
    }
    if (resultsSection) resultsSection.classList.add('results-hidden');
}

// Hide Loading State
function hideLoading() {
    if (loadingSection) loadingSection.classList.add('loading-hidden');
    setTimeout(() => {
        if (loadingSection) loadingSection.style.display = 'none';
    }, 300);
}

// Show Results
function showResults() {
    hideLoading();
    if (resultsSection) {
        resultsSection.classList.remove('results-hidden');
        resultsSection.style.display = 'block';
        // Smooth scroll to results
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Generate Travel Plan
async function generateTravelPlan(tripData) {
    const { budget, days, destination, travelType } = tripData;
    
    // Update destination header
    updateDestinationHeader(destination, travelType);
    
    // Load destination image
    await loadDestinationImage(destination);
    
    // Generate budget breakdown
    generateBudgetBreakdown(budget, days, travelType);
    
    // Load weather data
    await loadWeatherData(destination);
    
    // Load tourist attractions
    await loadTouristAttractions(destination);
    
    // Initialize map
    await initializeMap(destination);
    
    // Generate travel tips
    generateTravelTips(destination.toLowerCase(), travelType);
}

// Update Destination Header
function updateDestinationHeader(destination, travelType) {
    const destNameEl = document.getElementById('destination-name');
    const destTypeEl = document.getElementById('destination-type');
    if (destNameEl) destNameEl.textContent = destination;
    if (destTypeEl) destTypeEl.textContent = `${travelType.charAt(0).toUpperCase() + travelType.slice(1)} Destination`;
}

// Load Destination Image with improved error handling
const API_KEY = "49779190-56ac3b8e27bb9397dd241c851";

async function loadDestinationImage(destination) {
    const img = document.getElementById("destination-photo"); 
    if (!img) return;
    
    const url = `https://pixabay.com/api/?key=${API_KEY}&q=${encodeURIComponent(destination)}&image_type=photo&orientation=horizontal&per_page=5&safesearch=true`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch Pixabay API");

        const data = await response.json();

        if (data.hits && data.hits.length > 0) {
            // Use the first matching image with highest resolution
            const bestImage = data.hits.find(hit => hit.largeImageURL) || data.hits[0];
            img.src = bestImage.largeImageURL || bestImage.webformatURL;
            img.alt = `Beautiful view of ${destination}`;
        } else {
            // Fallback Unsplash random image
            img.src = `https://source.unsplash.com/800x400/?${encodeURIComponent(destination)},travel`;
            img.alt = `Beautiful view of ${destination}`;
        }

    } catch (error) {
        console.error("Error loading Pixabay image:", error);
        // Fallback Unsplash if API fails
        img.src = `https://source.unsplash.com/800x400/?${encodeURIComponent(destination)},travel`;
        img.alt = `Beautiful view of ${destination}`;
    }
}

// Generate Budget Breakdown with clickable items
function generateBudgetBreakdown(budget, days, travelType) {
    const breakdown = BUDGET_BREAKDOWN[travelType];
    const budgetGrid = document.getElementById('budget-breakdown');
    
    const categories = [
        { key: 'accommodation', icon: '🏨', name: 'Accommodation' },
        { key: 'food', icon: '🍽', name: 'Food & Dining' },
        { key: 'transport', icon: '🚗', name: 'Transportation' },
        { key: 'activities', icon: '🎯', name: 'Activities' },
        { key: 'shopping', icon: '🛍', name: 'Shopping' }
    ];
    
    budgetGrid.innerHTML = categories.map(category => {
        const amount = Math.round((budget * breakdown[category.key]) / 100);
        const dailyAmount = Math.round(amount / days);
        
        return `
            <div class="budget-item" onclick="showBudgetDetails('${category.key}', ${amount}, '${category.name}')">
                <div class="budget-category">${category.icon} ${category.name}</div>
                <div class="budget-amount">₹${amount.toLocaleString()}</div>
                <div class="budget-percentage">${breakdown[category.key]}% • ₹${dailyAmount}/day</div>
            </div>
        `;
    }).join('');
}

// Show Budget Details Modal
function showBudgetDetails(category, totalAmount, categoryName) {
    const modal = document.getElementById('budget-modal');
    const title = document.getElementById('modal-category-title');
    const content = document.getElementById('modal-category-content');
    
    if (!modal || !title || !content) return;
    
    title.textContent = `${categoryName} - Detailed Breakdown`;
    
    const expenses = DETAILED_EXPENSES[category];
    content.innerHTML = Object.entries(expenses).map(([expenseName, percentage]) => {
        const amount = Math.round(totalAmount * percentage);
        return `
            <div class="expense-item">
                <div class="expense-name">${expenseName}</div>
                <div class="expense-amount">₹${amount.toLocaleString()}</div>
            </div>
        `;
    }).join('');
    
    modal.classList.remove('budget-modal-hidden');
}

// Close Budget Modal
function closeBudgetModal() {
    const modal = document.getElementById('budget-modal');
    if (modal) {
        modal.classList.add('budget-modal-hidden');
    }
}

// Load Weather Data
async function loadWeatherData(destination) {
    const weatherContainer = document.getElementById('weather-info');
    if (!weatherContainer) return;
    
    weatherContainer.innerHTML = `
        <div class="weather-loading">
            <div class="loading-spinner" style="width: 32px; height: 32px;"></div>
            <span>Loading weather...</span>
        </div>
    `;

    const apiKey = "9a4acb8d47cf4c86a5943744250604";
    const url = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(destination)}&aqi=yes`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Weather API error');
        const data = await response.json();

        weatherContainer.innerHTML = `
            <div class="weather-main">
                <img src="${data.current.condition.icon}" alt="${data.current.condition.text}" class="weather-icon">
                <div>
                    <h4>${data.location.name}, ${data.location.country}</h4>
                    <p>${data.current.condition.text}</p>
                    <p>🌡 ${data.current.temp_c}°C &nbsp; 💧 Humidity: ${data.current.humidity}%</p>
                    <p>🌬 Wind: ${data.current.wind_kph} km/h</p>
                    <p>🌅 Local Time: ${data.location.localtime}</p>
                </div>
            </div>
        `;
    } catch (error) {
        weatherContainer.innerHTML = `
            <div class="weather-error">
                <span>⚠ Unable to load weather data for ${destination}. Please try again later.</span>
            </div>
        `;
        console.error('Weather API error:', error);
    }
}

// Load Tourist Attractions with improved image handling
async function loadTouristAttractions(destination) {
    const attractionsGrid = document.getElementById('attractions-grid');
    if (!attractionsGrid) return;
    
    // Show loading state
    attractionsGrid.innerHTML = Array(4).fill(0).map(() => `
        <div class="attraction-card">
            <div style="height: 200px; background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center;">
                <div class="loading-spinner" style="width: 40px; height: 40px;"></div>
            </div>
            <div class="attraction-info">
                <div style="height: 20px; background: rgba(255,255,255,0.1); margin-bottom: 12px; border-radius: 4px;"></div>
                <div style="height: 60px; background: rgba(255,255,255,0.05); border-radius: 4px;"></div>
            </div>
        </div>
    `).join('');
    
    try {
        // Try to get attractions using Wikipedia API
        let attractions = await fetchWikipediaAttractions(destination);
        
        // If no Wikipedia results, try Pixabay for generic attraction images
        if (!attractions || attractions.length === 0) {
            attractions = await generatePixabayAttractions(destination);
        }
        
        if (attractions && attractions.length > 0) {
            attractionsGrid.innerHTML = attractions.map(attraction => `
                <div class="attraction-card" onclick="window.open('${attraction.url}', '_blank')">
                    <img src="${attraction.image}" alt="${attraction.title}" class="attraction-image" 
                         onerror="this.onerror=null; this.src='https://source.unsplash.com/300x200/?${encodeURIComponent(attraction.title.split(' ')[0])},landmark';">
                    <div class="attraction-info">
                        <h4 class="attraction-title">${attraction.title}</h4>
                        <p class="attraction-description">${attraction.description}</p>
                        <a href="${attraction.url}" class="attraction-link" target="_blank">Learn More →</a>
                    </div>
                </div>
            `).join('');
        } else {
            // Final fallback to generic attractions
            generateFallbackAttractions(destination, attractionsGrid);
        }
    } catch (error) {
        console.error('Error loading attractions:', error);
        generateFallbackAttractions(destination, attractionsGrid);
    }
}

// Fetch attractions using Pixabay for better image quality
async function generatePixabayAttractions(destination) {
    try {
        const queries = [
            `${destination} landmarks`,
            `${destination} tourist attractions`,
            `${destination} monuments`,
            `${destination} architecture`
        ];
        
        const attractions = [];
        
        for (let i = 0; i < Math.min(4, queries.length); i++) {
            const query = queries[i];
            const response = await fetch(`https://pixabay.com/api/?key=${API_KEY}&q=${encodeURIComponent(query)}&image_type=photo&orientation=horizontal&per_page=3&safesearch=true`);
            const data = await response.json();
            
            if (data.hits && data.hits.length > 0) {
                const hit = data.hits[0];
                attractions.push({
                    title: `${destination} ${['Historic Center', 'Cultural District', 'Landmark', 'Monument'][i]}`,
                    description: `Explore the beautiful ${['historic architecture and cultural heritage', 'vibrant arts scene and local culture', 'iconic landmarks and scenic beauty', 'traditional monuments and history'][i]} of ${destination}. A must-visit destination for travelers.`,
                    image: hit.largeImageURL || hit.webformatURL,
                    url: `https://www.google.com/search?q=${encodeURIComponent(destination + ' tourist attractions')}`
                });
            }
        }
        
        return attractions.length > 0 ? attractions : null;
    } catch (error) {
        console.error('Error fetching Pixabay attractions:', error);
        return null;
    }
}

// Fetch Wikipedia Attractions
async function fetchWikipediaAttractions(destination) {
    try {
        // Search for attractions in the destination
        const searchResponse = await fetch(
            `https://en.wikipedia.org/api/rest_v1/page/search/${encodeURIComponent(destination + ' attractions')}`
        );
        const searchData = await searchResponse.json();
        
        if (!searchData.pages || searchData.pages.length === 0) {
            return null;
        }
        
        const attractions = [];
        const maxAttractions = Math.min(4, searchData.pages.length);
        
        for (let i = 0; i < maxAttractions; i++) {
            try {
                const page = searchData.pages[i];
                const summaryResponse = await fetch(
                    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(page.title)}`
                );
                const summaryData = await summaryResponse.json();
                
                attractions.push({
                    title: summaryData.title,
                    description: (summaryData.extract ? summaryData.extract.substring(0, 150) : 'Discover this amazing attraction in ' + destination) + '...',
                    image: summaryData.thumbnail ? summaryData.thumbnail.source : 
                           `https://source.unsplash.com/300x200/?${encodeURIComponent(summaryData.title.split(' ')[0])},landmark`,
                    url: summaryData.content_urls ? summaryData.content_urls.desktop.page : `https://en.wikipedia.org/wiki/${encodeURIComponent(summaryData.title)}`
                });
            } catch (error) {
                console.error('Error fetching attraction summary:', error);
                continue;
            }
        }
        
        return attractions.length > 0 ? attractions : null;
    } catch (error) {
        console.error('Error searching attractions:', error);
        return null;
    }
}

// Generate Fallback Attractions
function generateFallbackAttractions(destination, container) {
    const fallbackAttractions = [
        {
            title: `Historic Center of ${destination}`,
            description: `Explore the beautiful historic center with its charming streets, local architecture, and cultural landmarks.`,
            image: `https://source.unsplash.com/300x200/?${encodeURIComponent(destination)},historic,center`
        },
        {
            title: `${destination} Cultural District`,
            description: `Discover local culture, museums, art galleries, and traditional markets in this vibrant district.`,
            image: `https://source.unsplash.com/300x200/?${encodeURIComponent(destination)},culture,museum`
        },
        {
            title: `${destination} Natural Beauty`,
            description: `Experience the stunning natural landscapes, parks, gardens, and scenic viewpoints around the city.`,
            image: `https://source.unsplash.com/300x200/?${encodeURIComponent(destination)},nature,landscape`
        },
        {
            title: `Local Markets & Cuisine`,
            description: `Taste authentic local food, visit bustling markets, and experience the culinary delights of ${destination}.`,
            image: `https://source.unsplash.com/300x200/?${encodeURIComponent(destination)},food,market`
        }
    ];
    
    container.innerHTML = fallbackAttractions.map(attraction => `
        <div class="attraction-card">
            <img src="${attraction.image}" alt="${attraction.title}" class="attraction-image">
            <div class="attraction-info">
                <h4 class="attraction-title">${attraction.title}</h4>
                <p class="attraction-description">${attraction.description}</p>
                <span class="attraction-link">Popular Destination 🌟</span>
            </div>
        </div>
    `).join('');
}

// Initialize Interactive Map
async function initializeMap(destination) {
    const mapContainer = document.getElementById('location-map');
    if (!mapContainer) return;

    try {
        // Clear existing map if any
        if (mapInstance) {
            mapInstance.remove();
            mapInstance = null;
        }

        // Clear markers
        markers = [];

        // Get coordinates for destination
        const coordinates = await getCoordinates(destination);
        if (!coordinates) {
            throw new Error('Could not get coordinates for destination');
        }

        // Initialize map
        mapInstance = L.map('location-map').setView([coordinates.lat, coordinates.lon], 12);

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(mapInstance);

        // Add main destination marker
        const mainMarker = L.marker([coordinates.lat, coordinates.lon], {
            icon: L.divIcon({
                className: 'custom-marker destination-marker',
                html: `<div style="background: #e74c3c; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.3);"></div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            })
        }).addTo(mapInstance);

        mainMarker.bindPopup(`<b>${destination}</b><br>Main Destination`).openPopup();
        markers.push(mainMarker);

        // Add attraction markers
        await addAttractionMarkers(destination, coordinates);

    } catch (error) {
        console.error('Error initializing map:', error);
        mapContainer.innerHTML = `
            <div style="height: 400px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.1); border-radius: 16px; color: rgba(255,255,255,0.8);">
                <div style="text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 16px;">🗺️</div>
                    <div>Map temporarily unavailable</div>
                    <div style="font-size: 0.9rem; margin-top: 8px;">Please check your internet connection</div>
                </div>
            </div>
        `;
    }
}

// Get coordinates using Nominatim API
async function getCoordinates(destination) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destination)}&limit=1`);
        const data = await response.json();
        
        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lon: parseFloat(data[0].lon)
            };
        }
        return null;
    } catch (error) {
        console.error('Error getting coordinates:', error);
        return null;
    }
}

// Add attraction markers to map
async function addAttractionMarkers(destination, centerCoords) {
    try {
        // Search for nearby attractions using Overpass API
        const overpassQuery = `
            [out:json][timeout:25];
            (
              node["tourism"~"^(attraction|museum|monument|castle|viewpoint)$"](around:10000,${centerCoords.lat},${centerCoords.lon});
              way["tourism"~"^(attraction|museum|monument|castle|viewpoint)$"](around:10000,${centerCoords.lat},${centerCoords.lon});
              relation["tourism"~"^(attraction|museum|monument|castle|viewpoint)$"](around:10000,${centerCoords.lat},${centerCoords.lon});
            );
            out center;
        `;

        const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;
        const response = await fetch(overpassUrl);
        const data = await response.json();

        if (data && data.elements) {
            // Limit to first 10 attractions
            const attractions = data.elements.slice(0, 10);
            
            attractions.forEach(attraction => {
                let lat, lon;
                
                if (attraction.lat && attraction.lon) {
                    lat = attraction.lat;
                    lon = attraction.lon;
                } else if (attraction.center) {
                    lat = attraction.center.lat;
                    lon = attraction.center.lon;
                } else {
                    return; // Skip if no coordinates
                }

                const name = attraction.tags.name || attraction.tags.tourism || 'Tourist Attraction';
                
                const attractionMarker = L.marker([lat, lon], {
                    icon: L.divIcon({
                        className: 'custom-marker attraction-marker',
                        html: `<div style="background: #3498db; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
                        iconSize: [16, 16],
                        iconAnchor: [8, 8]
                    })
                }).addTo(mapInstance);

                attractionMarker.bindPopup(`<b>${name}</b><br>Tourist Attraction`);
                markers.push(attractionMarker);
            });
        }
    } catch (error) {
        console.error('Error adding attraction markers:', error);
        // Add some default markers around the center
        addDefaultMarkers(centerCoords);
    }
}

// Add default markers if API fails
function addDefaultMarkers(centerCoords) {
    const defaultAttractions = [
        { name: 'Historic Center', offset: [0.005, 0.005] },
        { name: 'Cultural District', offset: [-0.005, 0.005] },
        { name: 'Local Market', offset: [0.003, -0.003] },
        { name: 'Scenic Viewpoint', offset: [-0.003, -0.005] }
    ];

    defaultAttractions.forEach(attraction => {
        const lat = centerCoords.lat + attraction.offset[0];
        const lon = centerCoords.lon + attraction.offset[1];
        
        const marker = L.marker([lat, lon], {
            icon: L.divIcon({
                className: 'custom-marker attraction-marker',
                html: `<div style="background: #3498db; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
                iconSize: [16, 16],
                iconAnchor: [8, 8]
            })
        }).addTo(mapInstance);

        marker.bindPopup(`<b>${attraction.name}</b><br>Must-Visit Location`);
        markers.push(marker);
    });
}

// Generate Travel Tips
function generateTravelTips(destination, travelType) {
    const tips = TRAVEL_TIPS[destination] || generateGenericTips(travelType);
    
    const budgetFriendlyList = document.getElementById('budget-friendly');
    const avoidSpotsList = document.getElementById('avoid-spots');
    
    if (budgetFriendlyList) {
        budgetFriendlyList.innerHTML = tips.budgetFriendly.map(tip => `<li>💡 ${tip}</li>`).join('');
    }
    
    if (avoidSpotsList) {
        avoidSpotsList.innerHTML = tips.avoid.map(tip => `<li>⚠ ${tip}</li>`).join('');
    }
}

// Generate Generic Tips
function generateGenericTips(travelType) {
    if (travelType === 'domestic') {
        return {
            budgetFriendly: [
                'Use public transportation instead of private taxis',
                'Book accommodation in advance for better deals',
                'Eat at local restaurants rather than hotel dining',
                'Look for free walking tours and attractions',
                'Travel during off-peak seasons for lower prices'
            ],
            avoid: [
                'Peak season hotel and flight bookings',
                'Tourist trap restaurants near major attractions',
                'Expensive guided tours (explore on your own)',
                'Airport food and shopping (overpriced)'
            ]
        };
    } else {
        return {
            budgetFriendly: [
                'Book flights well in advance or look for deals',
                'Use public transport and walking instead of taxis',
                'Stay in hostels or budget accommodations',
                'Cook some meals if accommodation has kitchen',
                'Look for free museums and attractions'
            ],
            avoid: [
                'Currency exchange at airports (poor rates)',
                'Tourist restaurants in main squares',
                'Expensive international roaming charges',
                'Peak season travel without advance booking'
            ]
        };
    }
}

// Surprise Me Functionality
function surpriseMe(event) {
    const allDestinations = [...DESTINATIONS.domestic, ...DESTINATIONS.international];
    const randomDestination = allDestinations[Math.floor(Math.random() * allDestinations.length)];
    const isInternational = DESTINATIONS.international.includes(randomDestination);
    
    // Fill form with random data
    const destEl = document.getElementById('destination');
    const travelTypeEl = document.getElementById('travelType');
    const budgetEl = document.getElementById('budget');
    const daysEl = document.getElementById('days');
    if (destEl) destEl.value = randomDestination;
    if (travelTypeEl) travelTypeEl.value = isInternational ? 'international' : 'domestic';
    if (budgetEl) budgetEl.value = Math.floor(Math.random() * 50000) + 10000;
    if (daysEl) daysEl.value = Math.floor(Math.random() * 10) + 3;
    
    // Add fun animation
    const surpriseBtn = (event && event.target) ? event.target.closest('.btn') : document.querySelector('.btn');
    if (surpriseBtn) {
        surpriseBtn.style.transform = 'rotate(360deg) scale(1.1)';
        setTimeout(() => {
            surpriseBtn.style.transform = '';
        }, 500);
    }
    
    showToast(`🎲 Surprise! How about ${randomDestination}?`);
}

// Dark Mode Toggle
function toggleDarkMode() {
    document.body.classList.toggle('dark');
    const modeIcon = document.getElementById('mode-icon');
    const isDark = document.body.classList.contains('dark');
    
    if (modeIcon) modeIcon.textContent = isDark ? '☀' : '🌙';
    
    // Save preference to in-memory storage (not localStorage as per instructions)
    window.darkMode = isDark;
    
    showToast(isDark ? '🌙 Dark mode enabled' : '☀ Light mode enabled');
}

// Load Dark Mode Preference
document.addEventListener('DOMContentLoaded', function() {
    // Check for saved preference in memory
    if (window.darkMode) {
        document.body.classList.add('dark');
        const modeIcon = document.getElementById('mode-icon');
        if (modeIcon) modeIcon.textContent = '☀';
    }
});

// Chatbot Functions
function toggleChatbot() {
    if (chatbotWindow) chatbotWindow.classList.toggle('chatbot-hidden');
    
    if (chatbotWindow && !chatbotWindow.classList.contains('chatbot-hidden')) {
        if (chatbotInput) chatbotInput.focus();
    }
}

function handleChatInput(event) {
    if (event.key === 'Enter') {
        sendChatMessage();
    }
}

async function sendChatMessage() {
    const message = chatbotInput ? chatbotInput.value.trim() : '';
    if (!message) return;
    
    // Add user message
    const typingId = addChatMessage(message, 'user');
    if (chatbotInput) chatbotInput.value = '';
    
    // Add typing indicator
    const typingIndicatorId = addChatMessage('🤖 Typing...', 'bot');
    
    try {
        const response = await getChatbotResponse(message);
        
        // Remove typing indicator and add real response
        const typingEl = document.getElementById(typingIndicatorId);
        if (typingEl) typingEl.remove();
        addChatMessage(response, 'bot');
    } catch (error) {
        const typingEl = document.getElementById(typingIndicatorId);
        if (typingEl) typingEl.remove();
        addChatMessage('Sorry, I encountered an error. Please try asking something else!', 'bot');
    }
}

function addChatMessage(message, sender) {
    const messageDiv = document.createElement('div');
    const messageId = 'msg-' + Date.now();
    messageDiv.id = messageId;
    messageDiv.className = `chat-message ${sender}-message`;
    messageDiv.innerHTML = `<p>${message}</p>`;
    
    if (chatbotMessages) {
        chatbotMessages.appendChild(messageDiv);
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }
    
    return messageId;
}

async function getChatbotResponse(query) {
    try {
        // Add destination context if available
        const contextualQuery = currentTripData.destination 
            ? `${query} ${currentTripData.destination}` 
            : query;
        
        const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(contextualQuery)}&format=json&no_html=1&skip_disambig=1`);
        const data = await response.json();
        
        if (data.AbstractText) {
            return data.AbstractText;
        } else if (data.RelatedTopics && data.RelatedTopics.length > 0) {
            return data.RelatedTopics[0].Text;
        } else {
            return getFallbackResponse(query);
        }
    } catch (error) {
        return getFallbackResponse(query);
    }
}

function getFallbackResponse(query) {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('weather')) {
        return "Check the weather section above for current conditions! 🌤";
    } else if (lowerQuery.includes('budget')) {
        return "I've created a smart budget breakdown for your trip above. Click on any category to see detailed expenses! 💰";
    } else if (lowerQuery.includes('attraction') || lowerQuery.includes('place')) {
        return "Check out the attractions section above for must-visit places! I've also added them to the interactive map below. 🏛";
    } else if (lowerQuery.includes('map')) {
        return "Scroll down to see the interactive map with all the must-visit locations pinned! You can click on markers for more info. 🗺️";
    } else if (lowerQuery.includes('food')) {
        return "Don't miss trying local cuisine! Look for authentic local restaurants and street food - they're usually more budget-friendly and delicious! 🍽";
    } else if (lowerQuery.includes('transport')) {
        return "Public transport is usually your best bet for budget travel. Consider getting daily/weekly passes if available! 🚗";
    } else {
        return "That's a great question! While I search for more info, check out your personalized travel plan above - it has tons of useful details including an interactive map! ✨";
    }
}

// Save Itinerary Function
function saveItinerary() {
    if (!currentTripData.destination) {
        showToast('❌ No itinerary to save. Generate a plan first!');
        return;
    }
    
    const itinerary = generateItineraryText();
    const blob = new Blob([itinerary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentTripData.destination}-Itinerary.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('💾 Itinerary saved successfully!');
}

function generateItineraryText() {
    const { destination, budget, days, travelType } = currentTripData;
    
    return `
🌟 TRAVEL ITINERARY - ${destination ? destination.toUpperCase() : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 Destination: ${destination}
🌍 Travel Type: ${travelType ? (travelType.charAt(0).toUpperCase() + travelType.slice(1)) : ''}
💰 Budget: ₹${budget ? budget.toLocaleString() : '0'}
📅 Duration: ${days ? days : 0} days

💸 BUDGET BREAKDOWN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏨 Accommodation: ₹${Math.round(budget * (BUDGET_BREAKDOWN[travelType]?.accommodation || 0) / 100).toLocaleString()}
🍽 Food & Dining: ₹${Math.round(budget * (BUDGET_BREAKDOWN[travelType]?.food || 0) / 100).toLocaleString()}
🚗 Transportation: ₹${Math.round(budget * (BUDGET_BREAKDOWN[travelType]?.transport || 0) / 100).toLocaleString()}
🎯 Activities: ₹${Math.round(budget * (BUDGET_BREAKDOWN[travelType]?.activities || 0) / 100).toLocaleString()}
🛍 Shopping: ₹${Math.round(budget * (BUDGET_BREAKDOWN[travelType]?.shopping || 0) / 100).toLocaleString()}

✅ BUDGET-FRIENDLY TIPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${getTipsForDestination(destination ? destination.toLowerCase() : '').budgetFriendly.map(tip => `• ${tip}`).join('\n')}

❌ PLACES TO AVOID (OVERPRICED)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${getTipsForDestination(destination ? destination.toLowerCase() : '').avoid.map(tip => `• ${tip}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Generated by TravelVibes ✈️ - Your AI Travel Companion
Happy Travels! 🌟
`;
}

function getTipsForDestination(destination) {
    return TRAVEL_TIPS[destination] || generateGenericTips(currentTripData.travelType);
}

// Plan New Trip
function planNewTrip() {
    // Reset form
    if (form) form.reset();
    currentTripData = {};
    
    // Clean up map
    if (mapInstance) {
        mapInstance.remove();
        mapInstance = null;
    }
    markers = [];
    
    // Hide results and show form
    if (resultsSection) resultsSection.classList.add('results-hidden');
    const travelFormEl = document.getElementById('travel-form');
    if (travelFormEl) travelFormEl.style.display = 'block';
    
    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    showToast('🆕 Ready for a new adventure!');
}

// Toast Notification Function
function showToast(message) {
    const toastMessage = document.getElementById('toast-message');
    if (!toastMessage || !toast) return;
    toastMessage.textContent = message;
    
    toast.classList.remove('toast-hidden');
    
    setTimeout(() => {
        toast.classList.add('toast-hidden');
    }, 3000);
}

// Add smooth animations on scroll
window.addEventListener('scroll', function() {
    const cards = document.querySelectorAll('.glass-card');
    
    cards.forEach(card => {
        const cardTop = card.getBoundingClientRect().top;
        const cardVisible = cardTop < window.innerHeight && cardTop > 0;
        
        if (cardVisible) {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }
    });
});

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    const modal = document.getElementById('budget-modal');
    if (modal && event.target === modal) {
        closeBudgetModal();
    }
});

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    // Add welcome message
    setTimeout(() => {
        showToast('✨ Welcome to TravelVibes! Plan your perfect trip!');
    }, 1000);
    
    // Add subtle animations to buttons
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px) scale(1.02)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
});