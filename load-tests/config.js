// load-tests/config.js

export const CONFIG = {
  baseUrl: __ENV.API_BASE_URL || 'http://localhost:3000',
  authToken: __ENV.TEST_AUTH_TOKEN || 'test_jwt_bearer_token',
  
  // Geographic clusters in Ilorin, Kwara State
  clusters: {
    TANKE: {
      lat: 8.4799,
      lng: 4.5418,
      radiusKm: 3.5,
    },
    GRA: {
      lat: 8.4900,
      lng: 4.5300,
      radiusKm: 2.5,
    },
    FATE: {
      lat: 8.4850,
      lng: 4.5650,
      radiusKm: 3.0,
    },
    CHALLENGE: {
      lat: 8.4680,
      lng: 4.5250,
      radiusKm: 2.0,
    },
  },
  
  // Realistic menu sample
  sampleItems: [
    { name: 'Smoky Jollof Rice & Crispy Chicken', price: 2500, category: 'RICE' },
    { name: 'Amala with Gbegiri, Ewedu & Goat Meat', price: 2800, category: 'SWALLOW' },
    { name: 'Fried Rice & Peppered Turkey', price: 3200, category: 'RICE' },
    { name: 'Pounded Yam & Efo Riro with Assorted', price: 3000, category: 'SWALLOW' },
    { name: 'Beef Shawarma (Double Sausage)', price: 1800, category: 'SNACK' },
    { name: 'Chilled Chapman (500ml)', price: 700, category: 'DRINK' },
  ],
};

/**
 * Generate a random UUID v4 string for idempotent requests.
 */
export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Generate random coordinate offset around cluster center.
 */
export function getRandomCoordinates(clusterKey = 'TANKE') {
  const cluster = CONFIG.clusters[clusterKey] || CONFIG.clusters.TANKE;
  // 1 deg latitude is approx 111km
  const latOffset = (Math.random() - 0.5) * (cluster.radiusKm / 111);
  // 1 deg longitude at 8.5N is approx 110km
  const lngOffset = (Math.random() - 0.5) * (cluster.radiusKm / 110);

  return {
    latitude: parseFloat((cluster.lat + latOffset).toFixed(6)),
    longitude: parseFloat((cluster.lng + lngOffset).toFixed(6)),
  };
}
